import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { BASE_URL } from '../objects/config/constants';
import { DailyQuestStatus } from '../objects/types/DailyQuestStatus';
import { getQuestLabel } from '../services/progressionService';
import { getAssetBytes as getAssetBytesFromLoader, getEmbeddedFontBuffer as getEmbeddedFontBufferUtil } from './assetLoader';
import { createPerfLogger } from './perfLogger';
import { cacheRenderOutput, createBoundedStringCache, SizedCache } from './renderImageHelpers';
import { ensureResvgWasm } from './resvgWasm';

type QuestImageGlobals = {
  __questResvgUriCache?: SizedCache<string>;
  __questRenderOutputCache?: Map<string, Uint8Array>;
  __questPendingRenders?: Map<string, Promise<Uint8Array>>;
};

const RESVG_URI_CACHE_MAX_BYTES = 24 * 1024 * 1024;

const G = globalThis as unknown as QuestImageGlobals;
G.__questResvgUriCache ??= createBoundedStringCache(RESVG_URI_CACHE_MAX_BYTES);
G.__questRenderOutputCache ??= new Map<string, Uint8Array>();
G.__questPendingRenders ??= new Map<string, Promise<Uint8Array>>();
const renderOutputCache = G.__questRenderOutputCache;
const pendingRenders = G.__questPendingRenders;

const RENDER_OUTPUT_CACHE_MAX = 32;

const ASSET_BASE_URL = BASE_URL;
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = '/assets/swordgame/art/board.webp';
const WIDTH = 1100;
const HEIGHT = 560;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function progressBar(progress: number, target: number): string {
  const safeTarget = Math.max(1, target);
  const safeProgress = Math.max(0, Math.min(progress, safeTarget));
  return `${'='.repeat(safeProgress)}${'-'.repeat(safeTarget - safeProgress)}`;
}

async function getEmbeddedFontBuffer(): Promise<Uint8Array | null> {
  return getEmbeddedFontBufferUtil('assets/swordgame/font/GintoNordMedium.otf', FONT_URL);
}

function buildRenderCacheKey(statuses: DailyQuestStatus[], fr: boolean, hasEmbeddedFont: boolean): string {
  const statusSignature = statuses.map(s => `${s.questKey}:${s.progress}:${s.target}:${s.claimed}`).join('|');
  return `${fr ? 'fr' : 'en'}::${hasEmbeddedFont ? 'font' : 'system'}::${statusSignature}`;
}

export async function buildQuestSvg(userId: string, statuses: DailyQuestStatus[], fr: boolean, hasEmbeddedFont = false, boardDataUri?: string): Promise<string> {
  void userId;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';
  const title = fr ? 'Quetes du Jour' : 'Daily Quests';
  const subtitle = fr ? 'Progression et recompenses' : 'Progress and rewards';

  const rowY = [190, 305, 420];
  const rows = statuses.slice(0, 3);

  const rowText = rows
    .map((status, idx) => {
      const completed = status.progress >= status.target;
      const statusLabel = status.claimed ? (fr ? 'OK' : 'DONE') : completed ? (fr ? 'PRET' : 'READY') : fr ? 'EN COURS' : 'IN PROGRESS';
      const statusColor = status.claimed ? '#5EF38C' : completed ? '#F7C948' : '#9db0e8';
      const claimState = status.claimed ? (fr ? 'Recuperee' : 'Claimed') : completed ? (fr ? 'A recuperer' : 'Ready to claim') : fr ? 'En cours' : 'In progress';

      return `
      <rect x="36" y="${rowY[idx] - 54}" width="1028" height="94" rx="14" fill="#0f1729" fill-opacity="0.74" />
      <circle cx="66" cy="${rowY[idx] - 20}" r="8" fill="${statusColor}" />
      <text x="84" y="${rowY[idx] - 14}" fill="${statusColor}" font-size="14" font-family="${fontFamily}">${escapeXml(statusLabel)}</text>
      <text x="212" y="${rowY[idx] - 14}" fill="#f5f7ff" font-size="31" font-family="${fontFamily}">${escapeXml(getQuestLabel(status.questKey, fr))}</text>
      <text x="106" y="${rowY[idx] + 16}" fill="#9db0e8" font-size="18" font-family="${fontFamily}">${escapeXml(`${progressBar(status.progress, status.target)} [${status.progress}/${status.target}]`)}</text>
      <text x="1030" y="${rowY[idx] - 14}" text-anchor="end" fill="#d8e1ff" font-size="20" font-family="${fontFamily}">${escapeXml(`+${status.rewardGold} gold`)}</text>
      <text x="1030" y="${rowY[idx] + 16}" text-anchor="end" fill="#5EF38C" font-size="18" font-family="${fontFamily}">${escapeXml(claimState)}</text>
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

export async function renderQuestImage(userId: string, statuses: DailyQuestStatus[], fr: boolean): Promise<Uint8Array> {
  const perf = createPerfLogger('renderQuestImage');
  await ensureResvgWasm();
  perf.mark('ensureResvgWasm');

  const fontBuffer = await getEmbeddedFontBuffer();
  perf.mark('getEmbeddedFontBuffer');

  const hasEmbeddedFont = Boolean(fontBuffer);
  const renderKey = buildRenderCacheKey(statuses, fr, hasEmbeddedFont);
  const cachedOutput = renderOutputCache.get(renderKey);
  if (cachedOutput) {
    perf.done('cache hit -> return');
    return cachedOutput;
  }

  const pendingRender = pendingRenders.get(renderKey);
  if (pendingRender) {
    return pendingRender;
  }

  const renderPromise = (async () => {
    const svg = await buildQuestSvg(userId, statuses, fr, hasEmbeddedFont);
    perf.mark('buildSvg');

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
    perf.mark('Resvg render -> PNG');

    const overlay = Photon.PhotonImage.new_from_byteslice(pngBytes);
    const boardBytes = await getAssetBytesFromLoader(BOARD_PATH, ASSET_BASE_URL);
    perf.mark('get board');

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
    perf.mark('Photon PNG -> WebP');

    cacheRenderOutput(renderKey, webpBytes, renderOutputCache, RENDER_OUTPUT_CACHE_MAX);
    perf.done();
    return webpBytes;
  })().finally(() => {
    pendingRenders.delete(renderKey);
  });

  pendingRenders.set(renderKey, renderPromise);
  return renderPromise;
}
