import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { ShopItem } from '../objects/types/ShopItem';
import { cacheRenderOutput, createBoundedArrayBufferCache, createBoundedStringCache, resolveResvgImageUri, SizedCache } from './renderImageHelpers';
import { ensureResvgWasm } from './resvgWasm';

type ShopImageGlobals = {
  __shopAssetCache?: SizedCache<ArrayBuffer>;
  __shopResvgUriCache?: SizedCache<string>;
  __shopFontBuffer?: Uint8Array;
  __shopRenderOutputCache?: Map<string, Uint8Array>;
  __shopPendingRenders?: Map<string, Promise<Uint8Array>>;
};

const ASSET_CACHE_MAX_BYTES = 20 * 1024 * 1024;
const RESVG_URI_CACHE_MAX_BYTES = 24 * 1024 * 1024;

const G = globalThis as unknown as ShopImageGlobals;
G.__shopAssetCache ??= createBoundedArrayBufferCache(ASSET_CACHE_MAX_BYTES);
G.__shopResvgUriCache ??= createBoundedStringCache(RESVG_URI_CACHE_MAX_BYTES);
G.__shopRenderOutputCache ??= new Map<string, Uint8Array>();
G.__shopPendingRenders ??= new Map<string, Promise<Uint8Array>>();
const assetCache = G.__shopAssetCache;
const resvgUriCache = G.__shopResvgUriCache;
const renderOutputCache = G.__shopRenderOutputCache;
const pendingRenders = G.__shopPendingRenders;
const pendingAssetFetches = new Map<string, Promise<ArrayBuffer | null>>();
const pendingResvgUriConversions = new Map<string, Promise<string | null>>();

const RENDER_OUTPUT_CACHE_MAX = 32;

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
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
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

async function resolveResvgImageUriShop(path: string | null): Promise<string | null> {
  return resolveResvgImageUri(path, ASSET_BASE_URL, pendingAssetFetches, pendingResvgUriConversions, assetCache, resvgUriCache);
}

function buildRenderCacheKey(items: ShopItem[], page: number, pageCount: number, fr: boolean, hasEmbeddedFont: boolean): string {
  const itemSignature = items.map(i => `${i.itemKey}:${i.price}`).join('|');
  return `${fr ? 'fr' : 'en'}::${hasEmbeddedFont ? 'font' : 'system'}::page${page}of${pageCount}::${itemSignature}`;
}

export async function buildShopSvg(items: ShopItem[], page: number, pageCount: number, fr: boolean, hasEmbeddedFont = false, boardDataUri?: string, iconUris?: Array<string | null>): Promise<string> {
  const width = WIDTH;
  const lineHeight = LINE_HEIGHT;
  const height = getCanvasHeight(items.length);
  const title = fr ? 'Boutique' : 'Shop';
  const subtitle = fr ? `Page ${page}/${pageCount} - ${items.length} items` : `Page ${page}/${pageCount} - ${items.length} items`;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';

  const lines = items.map((item, idx) => {
    const y = 170 + idx * lineHeight;
    const itemName = fr ? item.nameFr : item.nameEn;
    const iconHref = iconUris?.[idx] ? escapeXml(String(iconUris[idx])) : '';
    const iconTag = iconHref ? `<image href="${iconHref}" xlink:href="${iconHref}" x="44" y="${y - 20}" width="24" height="24" preserveAspectRatio="none" />` : '';

    return `
      <rect x="36" y="${y - 24}" width="1028" height="32" rx="8" fill="#0f1729" fill-opacity="0.72" />
      ${iconTag}
      <text x="80" y="${y - 2}" fill="#f5f7ff" font-size="20" font-family="${fontFamily}">${escapeXml(itemName)}</text>
      <text x="820" y="${y - 2}" fill="#9db0e8" font-size="18" font-family="${fontFamily}">${escapeXml(item.itemKey)}</text>
      <text x="1030" y="${y - 2}" text-anchor="end" fill="#ffffff" font-size="20" font-family="${fontFamily}">${item.price} gold</text>
    `;
  });

  const emptyState = !items.length ? `<text x="36" y="190" fill="#d7deef" font-size="22" font-family="${fontFamily}">${escapeXml(fr ? 'Aucun objet disponible sur cette page.' : 'No items available on this page.')}</text>` : '';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${boardDataUri ? `<image href="${escapeXml(String(boardDataUri))}" xlink:href="${escapeXml(String(boardDataUri))}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" />` : ''}
    <rect x="24" y="24" width="1052" height="${height - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="72" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)}</text>
    <text x="36" y="106" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(subtitle)}</text>
    <text x="80" y="136" fill="#7f8bad" font-size="14" font-family="${fontFamily}">${escapeXml(fr ? 'objet' : 'item')}</text>
    <text x="1030" y="136" text-anchor="end" fill="#7f8bad" font-size="14" font-family="${fontFamily}">price</text>
    ${lines.join('')}
    ${emptyState}
  </svg>`;
}

export async function renderShopImage(items: ShopItem[], page: number, pageCount: number, fr: boolean): Promise<Uint8Array> {
  await ensureResvgWasm();
  const fontBuffer = await getEmbeddedFontBuffer();
  const hasEmbeddedFont = Boolean(fontBuffer);
  const renderKey = buildRenderCacheKey(items, page, pageCount, fr, hasEmbeddedFont);
  const cachedOutput = renderOutputCache.get(renderKey);
  if (cachedOutput) {
    return cachedOutput;
  }

  const pendingRender = pendingRenders.get(renderKey);
  if (pendingRender) {
    return pendingRender;
  }

  const renderPromise = (async () => {
    const [boardUri, iconUris] = await Promise.all([resolveResvgImageUriShop(BOARD_PATH), Promise.all(items.map(item => resolveResvgImageUriShop(item.imagePath)))]);
    const boardDataUri = boardUri || undefined;

    const svg = await buildShopSvg(items, page, pageCount, fr, hasEmbeddedFont, boardDataUri, iconUris);
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
