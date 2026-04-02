import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { BASE_URL } from '../objects/config/constants';
import { AchievementOverviewItem } from '../objects/types/AchievementOverviewItem';
import { ensureResvgWasm } from './resvgWasm';

type AchievementsImageGlobals = {
  __achievementsIconCache?: Record<string, ArrayBuffer>;
  __achievementsFontBuffer?: Uint8Array;
};

const G = globalThis as unknown as AchievementsImageGlobals;
G.__achievementsIconCache ??= {};
const iconCache = G.__achievementsIconCache;

const ASSET_BASE_URL = BASE_URL;
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = '/assets/swordgame/art/board.webp';
const WIDTH = 1100;
const HEIGHT = 620;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function getAssetBytes(path: string): Promise<ArrayBuffer | null> {
  if (iconCache[path]) {
    return iconCache[path];
  }

  const response = await fetch(`${ASSET_BASE_URL}${path}`);
  if (!response.ok) {
    return null;
  }

  const buf = await response.arrayBuffer();
  iconCache[path] = buf;
  return buf;
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

export async function buildAchievementsSvg(
  userId: string,
  achievements: AchievementOverviewItem[],
  fr: boolean,
  hasEmbeddedFont = false
): Promise<string> {
  void userId;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';
  const unlockedCount = achievements.filter(item => item.unlocked).length;
  const title = fr ? 'Achievements' : 'Achievements';
  const subtitle = fr
    ? `Progression: ${unlockedCount}/${achievements.length}`
    : `Progress: ${unlockedCount}/${achievements.length}`;

  const rowY = [190, 280, 370, 460, 550];
  const rows = achievements.slice(0, 5);

  const rowText = rows
    .map((item, idx) => {
      const statusLabel = item.unlocked
        ? fr
          ? 'DEBLOQUE'
          : 'UNLOCKED'
        : fr
          ? 'VERROUILLE'
          : 'LOCKED';
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
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect x="24" y="24" width="1052" height="${HEIGHT - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="82" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)}</text>
    <text x="36" y="116" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(subtitle)}</text>
    ${rowText}
  </svg>`;
}

export async function renderAchievementsImage(
  userId: string,
  achievements: AchievementOverviewItem[],
  fr: boolean
): Promise<Uint8Array> {
  await ensureResvgWasm();
  const fontBuffer = await getEmbeddedFontBuffer();

  const svg = await buildAchievementsSvg(
    userId,
    achievements,
    fr,
    Boolean(fontBuffer)
  );
  const options = fontBuffer
    ? {
        font: {
          fontBuffers: [fontBuffer],
          loadSystemFonts: false,
          defaultFontFamily: 'GintoNordMedium',
        },
      }
    : { font: { loadSystemFonts: true } };

  const png = new Resvg(svg, options).render().asPng();
  const overlay = Photon.PhotonImage.new_from_byteslice(
    new Uint8Array(png.buffer.slice(0) as ArrayBuffer)
  );

  let board: Photon.PhotonImage | null = null;
  let canvas: Photon.PhotonImage;
  const boardBytes = await getAssetBytes(BOARD_PATH);

  if (boardBytes) {
    board = Photon.PhotonImage.new_from_byteslice(new Uint8Array(boardBytes));
    canvas = Photon.resize(
      board,
      WIDTH,
      HEIGHT,
      Photon.SamplingFilter.Lanczos3
    );
    Photon.watermark(canvas, overlay, 0n, 0n);
  } else {
    canvas = overlay;
  }

  const output = new Uint8Array(canvas.get_bytes());
  if (canvas !== overlay) {
    overlay.free();
  }

  board?.free();
  canvas.free();
  return output;
}