import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { BASE_URL } from '../objects/config/constants';
import { AchievementOverviewItem } from '../objects/types/AchievementOverviewItem';
import { cacheRenderOutput, createBoundedArrayBufferCache, createBoundedStringCache, resolveResvgImageUri, SizedCache } from './renderImageHelpers';
import { ensureResvgWasm } from './resvgWasm';

type AchievementsImageGlobals = {
  __achievementsAssetCache?: SizedCache<ArrayBuffer>;
  __achievementsResvgUriCache?: SizedCache<string>;
  __achievementsFontBuffer?: Uint8Array;
  __achievementsRenderOutputCache?: Map<string, Uint8Array>;
  __achievementsPendingRenders?: Map<string, Promise<Uint8Array>>;
};

const ASSET_CACHE_MAX_BYTES = 20 * 1024 * 1024;
const RESVG_URI_CACHE_MAX_BYTES = 24 * 1024 * 1024;

const G = globalThis as unknown as AchievementsImageGlobals;
G.__achievementsAssetCache ??= createBoundedArrayBufferCache(ASSET_CACHE_MAX_BYTES);
G.__achievementsResvgUriCache ??= createBoundedStringCache(RESVG_URI_CACHE_MAX_BYTES);
G.__achievementsRenderOutputCache ??= new Map<string, Uint8Array>();
G.__achievementsPendingRenders ??= new Map<string, Promise<Uint8Array>>();
const assetCache = G.__achievementsAssetCache;
const resvgUriCache = G.__achievementsResvgUriCache;
const renderOutputCache = G.__achievementsRenderOutputCache;
const pendingRenders = G.__achievementsPendingRenders;
const pendingAssetFetches = new Map<string, Promise<ArrayBuffer | null>>();
const pendingResvgUriConversions = new Map<string, Promise<string | null>>();

const RENDER_OUTPUT_CACHE_MAX = 32;

const ASSET_BASE_URL = BASE_URL;
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = '/assets/swordgame/art/board.webp';
const WIDTH = 1100;
const HEIGHT = 620;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function getEmbeddedFontBuffer(): Promise<Uint8Array | null> {
  if (G.__achievementsFontBuffer) {
    return G.__achievementsFontBuffer;
  }

  const response = await fetch(FONT_URL);
  if (!response.ok) {
    return null;
  }

  const fontBuffer = await response.arrayBuffer();
  const fontBytes = new Uint8Array(fontBuffer);
  G.__achievementsFontBuffer = fontBytes;
  return fontBytes;
}

async function resolveResvgImageUriAchievements(path: string | null): Promise<string | null> {
  return resolveResvgImageUri(path, ASSET_BASE_URL, pendingAssetFetches, pendingResvgUriConversions, assetCache, resvgUriCache);
}

function buildRenderCacheKey(achievements: AchievementOverviewItem[], fr: boolean, hasEmbeddedFont: boolean): string {
  const achievementSignature = achievements.map(a => `${a.key}:${a.unlocked}`).join('|');
  return `${fr ? 'fr' : 'en'}::${hasEmbeddedFont ? 'font' : 'system'}::${achievementSignature}`;
}

export async function buildAchievementsSvg(userId: string, achievements: AchievementOverviewItem[], fr: boolean, hasEmbeddedFont = false, boardDataUri?: string): Promise<string> {
  void userId;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';
  const unlockedCount = achievements.filter(item => item.unlocked).length;
  const title = fr ? 'Achievements' : 'Achievements';
  const subtitle = fr ? `Progression: ${unlockedCount}/${achievements.length}` : `Progress: ${unlockedCount}/${achievements.length}`;

  const rowY = [190, 280, 370, 460, 550];
  const rows = achievements.slice(0, 5);

  const rowText = rows
    .map((item, idx) => {
      const statusLabel = item.unlocked ? (fr ? 'DEBLOQUE' : 'UNLOCKED') : fr ? 'VERROUILLE' : 'LOCKED';
      const statusColor = item.unlocked ? '#5EF38C' : '#9db0e8';

      return `
      <rect x="36" y="${rowY[idx] - 50}" width="1028" height="74" rx="12" fill="#0f1729" fill-opacity="0.74" />
      <circle cx="62" cy="${rowY[idx] - 18}" r="7" fill="${statusColor}" />
      <text x="78" y="${rowY[idx] - 12}" fill="${statusColor}" font-size="14" font-family="${fontFamily}">${escapeXml(statusLabel)}</text>
      <text x="220" y="${rowY[idx] - 12}" fill="#f5f7ff" font-size="24" font-family="${fontFamily}">${escapeXml(item.title)}</text>
      <text x="220" y="${rowY[idx] + 12}" fill="#9db0e8" font-size="16" font-family="${fontFamily}">${escapeXml(item.description)}</text>
    `;
    })
    .join('');

  return `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    ${boardDataUri ? `<image href="${escapeXml(String(boardDataUri))}" xlink:href="${escapeXml(String(boardDataUri))}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="none" />` : ''}
    <rect x="24" y="24" width="1052" height="${HEIGHT - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="82" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)}</text>
    <text x="36" y="116" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(subtitle)}</text>
    ${rowText}
  </svg>`;
}

export async function renderAchievementsImage(userId: string, achievements: AchievementOverviewItem[], fr: boolean): Promise<Uint8Array> {
  await ensureResvgWasm();
  const fontBuffer = await getEmbeddedFontBuffer();
  const hasEmbeddedFont = Boolean(fontBuffer);
  const renderKey = buildRenderCacheKey(achievements, fr, hasEmbeddedFont);
  const cachedOutput = renderOutputCache.get(renderKey);
  if (cachedOutput) {
    return cachedOutput;
  }

  const pendingRender = pendingRenders.get(renderKey);
  if (pendingRender) {
    return pendingRender;
  }

  const renderPromise = (async () => {
    const [boardUri] = await Promise.all([resolveResvgImageUriAchievements(BOARD_PATH)]);
    const boardDataUri = boardUri || undefined;

    const svg = await buildAchievementsSvg(userId, achievements, fr, hasEmbeddedFont, boardDataUri);
    const options = fontBuffer
      ? {
          font: {
            fontBuffers: [fontBuffer],
            loadSystemFonts: false,
            defaultFontFamily: 'GintoNordMedium',
          },
        }
      : { font: { loadSystemFonts: true } };

    const pngBytes = new Resvg(svg, options).render().asPng();
    const image = Photon.PhotonImage.new_from_byteslice(pngBytes);
    let webpBytes: Uint8Array;
    try {
      webpBytes = image.get_bytes_webp();
    } finally {
      image.free();
    }

    cacheRenderOutput(renderKey, webpBytes, renderOutputCache, RENDER_OUTPUT_CACHE_MAX);
    return webpBytes;
  })().finally(() => {
    pendingRenders.delete(renderKey);
  });

  pendingRenders.set(renderKey, renderPromise);
  return renderPromise;
}
