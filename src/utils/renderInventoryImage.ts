import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { InventoryItemView } from '../objects/types/InventoryItemView';
import { ensureResvgWasm } from './resvgWasm';

type InventoryImageGlobals = {
  __inventoryIconCache?: Record<string, ArrayBuffer>;
  __inventoryFontBuffer?: Uint8Array;
};

const G = globalThis as unknown as InventoryImageGlobals;
G.__inventoryIconCache ??= {};
const iconCache = G.__inventoryIconCache;

const ASSET_BASE_URL = 'https://fox3000foxy.com/konosuba-rpg';
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = '/assets/swordgame/art/board.webp';
const WIDTH = 1100;
const LINE_HEIGHT = 40;

function getRowsCount(itemsCount: number): number {
  return Math.max(8, Math.min(itemsCount, 18));
}

function getCanvasHeight(itemsCount: number): number {
  return 220 + getRowsCount(itemsCount) * LINE_HEIGHT;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function getItemIconBytes(path: string | null): Promise<ArrayBuffer | null> {
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

async function getEmbeddedFontBuffer(): Promise<Uint8Array | null> {
  if (G.__inventoryFontBuffer) {
    return G.__inventoryFontBuffer;
  }

  const response = await fetch(FONT_URL);
  if (!response.ok) {
    return null;
  }

  const fontBuffer = await response.arrayBuffer();
  const fontBytes = new Uint8Array(fontBuffer);
  G.__inventoryFontBuffer = fontBytes;
  return fontBytes;
}

function rarityColor(rarity: string | null): string {
  switch (rarity) {
    case 'epic':
      return '#b48cff';
    case 'gold':
      return '#f7c948';
    case 'silver':
      return '#d5d9e0';
    case 'bronze':
      return '#d18a54';
    default:
      return '#7b8394';
  }
}

export async function buildSvg(userId: string, items: InventoryItemView[], fr: boolean, hasEmbeddedFont = false): Promise<string> {
  void userId;
  const width = WIDTH;
  const lineHeight = LINE_HEIGHT;
  //   const rows = getRowsCount(items.length);
  const height = getCanvasHeight(items.length);
  const title = fr ? 'Inventaire' : 'Inventory';
  const subtitle = fr ? `Objets: ${items.length}` : `Items: ${items.length}`;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';

  const visibleItems = items.length ? items.slice(0, 18) : [];

  const lines = visibleItems.map((item, idx) => {
    const y = 170 + idx * lineHeight;
    const name = fr ? item.nameFr : item.nameEn;
    const color = rarityColor(item.rarity);

    return `
      <rect x="36" y="${y - 24}" width="1028" height="32" rx="8" fill="#0f1729" fill-opacity="0.72" />
      <circle cx="56" cy="${y - 8}" r="8" fill="${color}" />
      <text x="80" y="${y - 2}" fill="#f5f7ff" font-size="20" font-family="${fontFamily}">${escapeXml(name)}</text>
      <text x="1030" y="${y - 2}" text-anchor="end" fill="#ffffff" font-size="20" font-family="${fontFamily}">x${item.quantity}</text>
    `;
  });

  const emptyState = !items.length ? `<text x="36" y="190" fill="#d7deef" font-size="22" font-family="${fontFamily}">${escapeXml(fr ? 'Aucun objet dans cet inventaire pour le moment.' : 'No item in this inventory yet.')}</text>` : '';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="24" y="24" width="1052" height="${height - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="72" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)}</text>
    <text x="36" y="106" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(subtitle)}</text>
    <text x="80" y="136" fill="#7f8bad" font-size="14" font-family="${fontFamily}">${escapeXml(fr ? 'objet' : 'item')}</text>
    <text x="1030" y="136" text-anchor="end" fill="#7f8bad" font-size="14" font-family="${fontFamily}">qty</text>
    ${lines.join('')}
    ${emptyState}
  </svg>`;
}

export async function renderInventoryImage(userId: string, items: InventoryItemView[], fr: boolean): Promise<Uint8Array> {
  await ensureResvgWasm();
  const fontBuffer = await getEmbeddedFontBuffer();
  const height = getCanvasHeight(items.length);

  const svg = await buildSvg(userId, items, fr, Boolean(fontBuffer));
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
  const overlay = Photon.PhotonImage.new_from_byteslice(new Uint8Array(png.buffer.slice(0) as ArrayBuffer));

  let board: Photon.PhotonImage | null = null;
  let canvas: Photon.PhotonImage;
  const boardBytes = await getItemIconBytes(BOARD_PATH);
  if (boardBytes) {
    board = Photon.PhotonImage.new_from_byteslice(new Uint8Array(boardBytes));
    canvas = Photon.resize(board, WIDTH, height, Photon.SamplingFilter.Lanczos3);
    Photon.watermark(canvas, overlay, 0n, 0n);
  } else {
    canvas = overlay;
  }

  const visibleItems = items.length ? items.slice(0, 18) : [];
  const iconBuffers = await Promise.all(visibleItems.map(item => getItemIconBytes(item.imagePath)));

  for (let idx = 0; idx < visibleItems.length; idx += 1) {
    const iconBuffer = iconBuffers[idx];
    if (!iconBuffer) {
      continue;
    }

    let icon: Photon.PhotonImage | null = null;
    let resized: Photon.PhotonImage | null = null;
    try {
      icon = Photon.PhotonImage.new_from_byteslice(new Uint8Array(iconBuffer));
      resized = Photon.resize(icon, 24, 24, Photon.SamplingFilter.Lanczos3);
      const y = 170 + idx * 40;
      Photon.watermark(canvas, resized, 44n, BigInt(y - 20));
    } catch {
      // Ignore icon decode errors and keep text-only row.
    } finally {
      resized?.free();
      icon?.free();
    }
  }

  const output = new Uint8Array(canvas.get_bytes());
  if (canvas !== overlay) {
    overlay.free();
  }
  board?.free();
  canvas.free();
  return output;
}
