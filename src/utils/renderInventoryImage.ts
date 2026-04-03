import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { InventoryItemView } from '../objects/types/InventoryItemView';
import { cacheRenderOutput, createBoundedArrayBufferCache, createBoundedStringCache, resolveAssetUrl, resolveResvgImageUri, SizedCache } from './renderImageHelpers';
import { ensureResvgWasm } from './resvgWasm';

type InventoryImageGlobals = {
  __inventoryAssetCache?: SizedCache<ArrayBuffer>;
  __inventoryResvgUriCache?: SizedCache<string>;
  __inventoryFontBuffer?: Uint8Array;
  __inventoryRenderOutputCache?: Map<string, Uint8Array>;
  __inventoryPendingRenders?: Map<string, Promise<Uint8Array>>;
};

const ASSET_CACHE_MAX_BYTES = 20 * 1024 * 1024;
const RESVG_URI_CACHE_MAX_BYTES = 24 * 1024 * 1024;

const G = globalThis as unknown as InventoryImageGlobals;
G.__inventoryAssetCache ??= createBoundedArrayBufferCache(ASSET_CACHE_MAX_BYTES);
G.__inventoryResvgUriCache ??= createBoundedStringCache(RESVG_URI_CACHE_MAX_BYTES);
G.__inventoryRenderOutputCache ??= new Map<string, Uint8Array>();
G.__inventoryPendingRenders ??= new Map<string, Promise<Uint8Array>>();
const assetCache = G.__inventoryAssetCache;
const resvgUriCache = G.__inventoryResvgUriCache;
const renderOutputCache = G.__inventoryRenderOutputCache;
const pendingRenders = G.__inventoryPendingRenders;
const pendingAssetFetches = new Map<string, Promise<ArrayBuffer | null>>();
const pendingResvgUriConversions = new Map<string, Promise<string | null>>();

const RENDER_OUTPUT_CACHE_MAX = 64;

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

async function resolveResvgImageUriInventory(path: string | null): Promise<string | null> {
  return resolveResvgImageUri(path, ASSET_BASE_URL, pendingAssetFetches, pendingResvgUriConversions, assetCache, resvgUriCache);
}

function buildRenderCacheKey(items: InventoryItemView[], fr: boolean, hasEmbeddedFont: boolean): string {
  const visibleItems = items.length ? items.slice(0, 18) : [];
  const visibleSignature = visibleItems.map(item => `${item.itemKey}:${item.quantity}:${item.rarity ?? ''}:${item.imagePath ?? ''}`).join('|');
  return `${fr ? 'fr' : 'en'}::${hasEmbeddedFont ? 'font' : 'system'}::${items.length}::${visibleSignature}`;
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

export async function buildSvg(userId: string, items: InventoryItemView[], fr: boolean, hasEmbeddedFont = false, boardDataUri?: string, iconUris?: Array<string | null>): Promise<string> {
  void userId;
  const width = WIDTH;
  const lineHeight = LINE_HEIGHT;
  const height = getCanvasHeight(items.length);
  const title = fr ? 'Inventaire' : 'Inventory';
  const subtitle = fr ? `Objets: ${items.length}` : `Items: ${items.length}`;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';

  const visibleItems = items.length ? items.slice(0, 18) : [];
  let resolvedBoardDataUri = boardDataUri;
  let resolvedIconUris = iconUris;

  if (!resolvedBoardDataUri) {
    resolvedBoardDataUri = resolveAssetUrl(BOARD_PATH, ASSET_BASE_URL) || undefined;
  }

  if (!resolvedIconUris) {
    resolvedIconUris = visibleItems.map(item => resolveAssetUrl(item.imagePath, ASSET_BASE_URL));
  }

  const lines = visibleItems.map((item, idx) => {
    const y = 170 + idx * lineHeight;
    const name = fr ? item.nameFr : item.nameEn;
    const color = rarityColor(item.rarity);
    const iconHref = resolvedIconUris?.[idx] ? escapeXml(String(resolvedIconUris[idx])) : '';
    const iconTag = iconHref ? `<image href="${iconHref}" xlink:href="${iconHref}" x="44" y="${y - 20}" width="24" height="24" preserveAspectRatio="none" />` : '';

    return `
      <rect x="36" y="${y - 24}" width="1028" height="32" rx="8" fill="#0f1729" fill-opacity="0.72" />
      <circle cx="56" cy="${y - 8}" r="8" fill="${color}" />
      ${iconTag}
      <text x="80" y="${y - 2}" fill="#f5f7ff" font-size="20" font-family="${fontFamily}">${escapeXml(name)}</text>
      <text x="1030" y="${y - 2}" text-anchor="end" fill="#ffffff" font-size="20" font-family="${fontFamily}">x${item.quantity}</text>
    `;
  });

  const emptyState = !items.length ? `<text x="36" y="190" fill="#d7deef" font-size="22" font-family="${fontFamily}">${escapeXml(fr ? 'Aucun objet dans cet inventaire pour le moment.' : 'No item in this inventory yet.')}</text>` : '';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${resolvedBoardDataUri ? `<image href="${escapeXml(resolvedBoardDataUri)}" xlink:href="${escapeXml(resolvedBoardDataUri)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" />` : ''}
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
  const hasEmbeddedFont = Boolean(fontBuffer);
  const renderKey = buildRenderCacheKey(items, fr, hasEmbeddedFont);
  const cachedOutput = renderOutputCache.get(renderKey);
  if (cachedOutput) {
    return cachedOutput;
  }

  const pendingRender = pendingRenders.get(renderKey);
  if (pendingRender) {
    return pendingRender;
  }

  const renderPromise = (async () => {
    const visibleItems = items.length ? items.slice(0, 18) : [];
    const [boardUri, iconUris] = await Promise.all([resolveResvgImageUriInventory(BOARD_PATH), Promise.all(visibleItems.map(item => resolveResvgImageUriInventory(item.imagePath)))]);
    const boardDataUri = boardUri || undefined;

    const svg = await buildSvg(userId, items, fr, hasEmbeddedFont, boardDataUri, iconUris);
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
