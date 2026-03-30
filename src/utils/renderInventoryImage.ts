import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { InventoryItemView } from '../services/inventoryService';

const WASM_URL = 'https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm';

let wasmInitPromise: Promise<void> | null = null;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function ensureWasm(): Promise<void> {
  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = (async () => {
    const response = await fetch(WASM_URL);
    if (!response.ok) {
      throw new Error(`WASM fetch failed: ${response.status}`);
    }

    const wasm = await response.arrayBuffer();
    await initWasm(wasm);
  })();

  return wasmInitPromise;
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

function buildSvg(userId: string, items: InventoryItemView[], fr: boolean): string {
  const width = 1100;
  const lineHeight = 40;
  const rows = Math.max(8, Math.min(items.length, 18));
  const height = 220 + rows * lineHeight;
  const title = fr ? 'Inventaire' : 'Inventory';
  const subtitle = fr
    ? `Joueur: ${userId}`
    : `Player: ${userId}`;

  const lines = (items.length ? items.slice(0, 18) : []).map((item, idx) => {
    const y = 170 + idx * lineHeight;
    const name = fr ? item.nameFr : item.nameEn;
    const rarity = item.rarity || (fr ? 'inconnu' : 'unknown');
    const typeLabel = item.accessoryType || item.itemType;
    const color = rarityColor(item.rarity);
    return `
      <rect x="36" y="${y - 24}" width="1028" height="32" rx="8" fill="#1f2532" />
      <circle cx="60" cy="${y - 8}" r="8" fill="${color}" />
      <text x="80" y="${y - 2}" fill="#f5f7ff" font-size="20" font-family="Verdana">${escapeXml(name)}</text>
      <text x="700" y="${y - 2}" fill="#adb7ce" font-size="16" font-family="Verdana">${escapeXml(typeLabel)}</text>
      <text x="860" y="${y - 2}" fill="#adb7ce" font-size="16" font-family="Verdana">${escapeXml(rarity)}</text>
      <text x="1030" y="${y - 2}" text-anchor="end" fill="#ffffff" font-size="20" font-family="Verdana">x${item.quantity}</text>
    `;
  });

  const emptyState = !items.length
    ? `<text x="36" y="190" fill="#d7deef" font-size="22" font-family="Verdana">${escapeXml(
        fr ? 'Aucun objet dans cet inventaire pour le moment.' : 'No item in this inventory yet.'
      )}</text>`
    : '';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#131826" />
        <stop offset="100%" stop-color="#212b45" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
    <rect x="24" y="24" width="1052" height="${height - 48}" rx="16" fill="#0f1422" stroke="#2d3750" />
    <text x="36" y="72" fill="#ffffff" font-size="42" font-family="Verdana">${escapeXml(title)}</text>
    <text x="36" y="106" fill="#b2bdd6" font-size="18" font-family="Verdana">${escapeXml(subtitle)}</text>
    <text x="80" y="136" fill="#7f8bad" font-size="14" font-family="Verdana">${escapeXml(fr ? 'objet' : 'item')}</text>
    <text x="700" y="136" fill="#7f8bad" font-size="14" font-family="Verdana">${escapeXml(fr ? 'type' : 'type')}</text>
    <text x="860" y="136" fill="#7f8bad" font-size="14" font-family="Verdana">${escapeXml(fr ? 'rarete' : 'rarity')}</text>
    <text x="1030" y="136" text-anchor="end" fill="#7f8bad" font-size="14" font-family="Verdana">qty</text>
    ${lines.join('')}
    ${emptyState}
  </svg>`;
}

export async function renderInventoryImage(
  userId: string,
  items: InventoryItemView[],
  fr: boolean
): Promise<Uint8Array> {
  await ensureWasm();

  const svg = buildSvg(userId, items, fr);
  const png = new Resvg(svg).render().asPng();
  return new Uint8Array(png);
}