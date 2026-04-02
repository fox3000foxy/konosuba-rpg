import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { ShopItem } from '../objects/types/ShopItem';
import { ensureResvgWasm } from './resvgWasm';

type ShopImageGlobals = {
  __shopIconCache?: Record<string, ArrayBuffer>;
  __shopFontBuffer?: Uint8Array;
};

const G = globalThis as unknown as ShopImageGlobals;
G.__shopIconCache ??= {};
const iconCache = G.__shopIconCache;

const ASSET_BASE_URL = 'https://fox3000foxy.com/konosuba-rpg';
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = '/assets/swordgame/art/board.webp';
const WIDTH = 1100;
const LINE_HEIGHT = 40;

function getRowsCount(itemsCount: number): number {
  return Math.max(4, Math.min(itemsCount, 16));
}

function getCanvasHeight(itemsCount: number): number {
  return 220 + getRowsCount(itemsCount) * LINE_HEIGHT;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function getEmbeddedFontBuffer(): Promise<Uint8Array | null> {
  if (G.__shopFontBuffer) {
    return G.__shopFontBuffer;
  }

  const response = await fetch(FONT_URL);
  if (!response.ok) {
    return null;
  }

  const fontBuffer = await response.arrayBuffer();
  const fontBytes = new Uint8Array(fontBuffer);
  G.__shopFontBuffer = fontBytes;
  return fontBytes;
}

async function getAssetBytes(path: string): Promise<ArrayBuffer | null> {
  if (!path) {
    return null;
  }

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

export async function buildShopSvg(
  items: ShopItem[],
  page: number,
  pageCount: number,
  fr: boolean,
  hasEmbeddedFont = false
): Promise<string> {
  const width = WIDTH;
  const lineHeight = LINE_HEIGHT;
  const height = getCanvasHeight(items.length);
  const title = fr ? 'Boutique' : 'Shop';
  const subtitle = fr
    ? `Page ${page}/${pageCount} - ${items.length} items`   
    : `Page ${page}/${pageCount} - ${items.length} items`;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';

  const lines = items.map((item, idx) => {
    const y = 170 + idx * lineHeight;
    const itemName = fr ? item.nameFr : item.nameEn;

    return `
      <rect x="36" y="${y - 24}" width="1028" height="32" rx="8" fill="#0f1729" fill-opacity="0.72" />
      <text x="80" y="${y - 2}" fill="#f5f7ff" font-size="20" font-family="${fontFamily}">${escapeXml(itemName)}</text>
      <text x="820" y="${y - 2}" fill="#9db0e8" font-size="18" font-family="${fontFamily}">${escapeXml(item.itemKey)}</text>
      <text x="1030" y="${y - 2}" text-anchor="end" fill="#ffffff" font-size="20" font-family="${fontFamily}">${item.price} gold</text>
    `;
  });

  const emptyState = !items.length
    ? `<text x="36" y="190" fill="#d7deef" font-size="22" font-family="${fontFamily}">${escapeXml(
        fr
          ? 'Aucun objet disponible sur cette page.'
          : 'No items available on this page.'
      )}</text>`
    : '';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="24" y="24" width="1052" height="${height - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="72" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)}</text>
    <text x="36" y="106" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(subtitle)}</text>
    <text x="80" y="136" fill="#7f8bad" font-size="14" font-family="${fontFamily}">${escapeXml(fr ? 'objet' : 'item')}</text>
    <text x="1030" y="136" text-anchor="end" fill="#7f8bad" font-size="14" font-family="${fontFamily}">price</text>
    ${lines.join('')}
    ${emptyState}
  </svg>`;
}

export async function renderShopImage(
  items: ShopItem[],
  page: number,
  pageCount: number,
  fr: boolean
): Promise<Uint8Array> {
  await ensureResvgWasm();
  const fontBuffer = await getEmbeddedFontBuffer();
  const svg = await buildShopSvg(items, page, pageCount, fr, Boolean(fontBuffer));

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
    canvas = Photon.resize(board, WIDTH, getCanvasHeight(items.length), Photon.SamplingFilter.Lanczos3);
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
