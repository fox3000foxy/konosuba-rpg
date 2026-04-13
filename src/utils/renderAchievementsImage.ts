import * as Photon from "@cf-wasm/photon";
import { BASE_URL } from "../objects/config/constants";
import type { AchievementOverviewItem } from "../objects/types/AchievementOverviewItem";
import { getAssetBytes as getAssetBytesFromLoader, getEmbeddedFontBuffer as getEmbeddedFontBufferUtil } from "./assetLoader";
import { createPerfLogger } from "./perfLogger";
import { cacheRenderOutput, createBoundedStringCache, type SizedCache } from "./renderImageHelpers";
import { ensureResvgWasm, renderSvgToPng } from "./resvgWasm";

type AchievementsImageGlobals = {
  __achievementsResvgUriCache?: SizedCache<string>;
  __achievementsRenderOutputCache?: Map<string, Uint8Array>;
  __achievementsPendingRenders?: Map<string, Promise<Uint8Array>>;
};

const RESVG_URI_CACHE_MAX_BYTES = 24 * 1024 * 1024;

const G = globalThis as unknown as AchievementsImageGlobals;
G.__achievementsResvgUriCache ??= createBoundedStringCache(RESVG_URI_CACHE_MAX_BYTES);
G.__achievementsRenderOutputCache ??= new Map<string, Uint8Array>();
G.__achievementsPendingRenders ??= new Map<string, Promise<Uint8Array>>();
const renderOutputCache = G.__achievementsRenderOutputCache;
const pendingRenders = G.__achievementsPendingRenders;

const RENDER_OUTPUT_CACHE_MAX = 32;

const ASSET_BASE_URL = BASE_URL;
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = "/assets/swordgame/art/board.webp";
const WIDTH = 1100;
const HEIGHT = 620;

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function getEmbeddedFontBuffer(): Promise<Uint8Array | null> {
  return getEmbeddedFontBufferUtil("assets/swordgame/font/GintoNordMedium.otf", FONT_URL);
}

function buildRenderCacheKey(achievements: AchievementOverviewItem[], fr: boolean, hasEmbeddedFont: boolean): string {
  const achievementSignature = achievements.map((a) => `${a.key}:${a.unlocked}`).join("|");
  return `${fr ? "fr" : "en"}::${hasEmbeddedFont ? "font" : "system"}::${achievementSignature}`;
}

export async function buildAchievementsSvg(userId: string, achievements: AchievementOverviewItem[], fr: boolean, hasEmbeddedFont = false, boardDataUri?: string): Promise<string> {
  void userId;
  const fontFamily = hasEmbeddedFont ? "GintoNordMedium" : "Arial";
  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const title = fr ? "Achievements" : "Achievements";
  const subtitle = fr ? `Progression: ${unlockedCount}/${achievements.length}` : `Progress: ${unlockedCount}/${achievements.length}`;

  const rowY = [190, 280, 370, 460, 550];
  const rows = achievements.slice(0, 5);

  const rowText = rows
    .map((item, idx) => {
      const statusLabel = item.unlocked ? (fr ? "DEBLOQUE" : "UNLOCKED") : fr ? "VERROUILLE" : "LOCKED";
      const statusColor = item.unlocked ? "#5EF38C" : "#9db0e8";

      return `
      <rect x="36" y="${rowY[idx] - 50}" width="1028" height="74" rx="12" fill="#0f1729" fill-opacity="0.74" />
      <circle cx="62" cy="${rowY[idx] - 18}" r="7" fill="${statusColor}" />
      <text x="78" y="${rowY[idx] - 12}" fill="${statusColor}" font-size="14" font-family="${fontFamily}">${escapeXml(statusLabel)}</text>
      <text x="220" y="${rowY[idx] - 12}" fill="#f5f7ff" font-size="24" font-family="${fontFamily}">${escapeXml(item.title)}</text>
      <text x="220" y="${rowY[idx] + 12}" fill="#9db0e8" font-size="16" font-family="${fontFamily}">${escapeXml(item.description)}</text>
    `;
    })
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    ${boardDataUri ? `<image href="${escapeXml(String(boardDataUri))}" xlink:href="${escapeXml(String(boardDataUri))}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="none" />` : ""}
    <rect x="24" y="24" width="1052" height="${HEIGHT - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="82" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)}</text>
    <text x="36" y="116" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(subtitle)}</text>
    ${rowText}
  </svg>`;
}

export async function renderAchievementsImage(userId: string, achievements: AchievementOverviewItem[], fr: boolean): Promise<Uint8Array> {
  const perf = createPerfLogger("renderAchievementsImage");
  await ensureResvgWasm();
  perf.mark("ensureResvgWasm");

  const fontBuffer = await getEmbeddedFontBuffer();
  perf.mark("getEmbeddedFontBuffer");

  const hasEmbeddedFont = Boolean(fontBuffer);
  const renderKey = buildRenderCacheKey(achievements, fr, hasEmbeddedFont);
  const cachedOutput = renderOutputCache.get(renderKey);
  if (cachedOutput) {
    perf.done("cache hit -> return");
    return cachedOutput;
  }

  const pendingRender = pendingRenders.get(renderKey);
  if (pendingRender) {
    return pendingRender;
  }

  const renderPromise = (async () => {
    const svg = await buildAchievementsSvg(userId, achievements, fr, hasEmbeddedFont);
    perf.mark("buildSvg");

    const options = fontBuffer
      ? {
          font: {
            fontBuffers: [fontBuffer],
            loadSystemFonts: false,
            defaultFontFamily: "GintoNordMedium",
          },
        }
      : { font: { loadSystemFonts: true } };

    const pngBytes = await renderSvgToPng(svg, options);
    perf.mark("Resvg render -> PNG");

    const overlay = Photon.PhotonImage.new_from_byteslice(pngBytes);
    const boardBytes = await getAssetBytesFromLoader(BOARD_PATH, ASSET_BASE_URL);
    perf.mark("get board");

    let board: Photon.PhotonImage | null = null;
    let canvas: Photon.PhotonImage;
    if (boardBytes) {
      board = Photon.PhotonImage.new_from_byteslice(new Uint8Array(boardBytes));
      canvas = Photon.resize(board, WIDTH, HEIGHT, Photon.SamplingFilter.Lanczos3);
      Photon.watermark(canvas, overlay, 0n, 0n);
    } else {
      canvas = overlay;
    }

    let webpBytes: Uint8Array;
    try {
      webpBytes = canvas.get_bytes_webp();
    } finally {
      if (canvas !== overlay) {
        overlay.free();
      }
      board?.free();
      canvas.free();
    }
    perf.mark("Photon PNG -> WebP");

    cacheRenderOutput(renderKey, webpBytes, renderOutputCache, RENDER_OUTPUT_CACHE_MAX);
    perf.done();
    return webpBytes;
  })().finally(() => {
    pendingRenders.delete(renderKey);
  });

  pendingRenders.set(renderKey, renderPromise);
  return renderPromise;
}
