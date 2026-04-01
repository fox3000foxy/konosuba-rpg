import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { BASE_URL } from '../objects/config/constants';
import { CharacterKey } from '../objects/enums/CharacterKey';
import { CharacterProgress } from '../objects/types/CharacterProgress';
import { ensureResvgWasm } from './resvgWasm';

type AffinityImageGlobals = {
  __affinityIconCache?: Record<string, ArrayBuffer>;
  __affinityFontBuffer?: Uint8Array;
};

const G = globalThis as unknown as AffinityImageGlobals;
G.__affinityIconCache ??= {};
const iconCache = G.__affinityIconCache;

const ASSET_BASE_URL = BASE_URL;
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = '/assets/swordgame/art/board.webp';
const STAR_ENABLED_PATH = '/assets/star-enabled.webp';
const STAR_DISABLED_PATH = '/assets/star-disabled.webp';

const WIDTH = 1100;
const HEIGHT = 560;
const STAR_SLOT_COUNT = 5;
const AFFINITY_POINTS_PER_STAR = 20;

type AffinityRow = {
  key: CharacterKey;
  label: string;
  affinity: number;
};

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
  if (G.__affinityFontBuffer) {
    return G.__affinityFontBuffer;
  }

  const response = await fetch(FONT_URL);
  if (!response.ok) {
    return null;
  }

  const fontBuffer = await response.arrayBuffer();
  const fontBytes = new Uint8Array(fontBuffer);
  G.__affinityFontBuffer = fontBytes;
  return fontBytes;
}

export function getAffinityStars(affinity: number): number {
  const safeAffinity = Math.max(0, affinity);
  const stars = Math.floor(safeAffinity / AFFINITY_POINTS_PER_STAR);
  return Math.max(0, Math.min(STAR_SLOT_COUNT, stars));
}

export function getAffinityTier(stars: number): 'basic' | 'gold' | 'epic' {
  if (stars >= 5) {
    return 'epic';
  }

  if (stars >= 4) {
    return 'gold';
  }

  return 'basic';
}

function getCharacterBadgePath(key: CharacterKey, stars: number): string {
  const badgeStars = Math.max(1, Math.min(5, stars || 1));
  return `/assets/characters-emojis/${key}_${badgeStars}_star.webp`;
}

function getTierLabel(fr: boolean, tier: 'basic' | 'gold' | 'epic'): string {
  if (!fr) {
    return tier;
  }

  if (tier === 'epic') {
    return 'epique';
  }

  if (tier === 'gold') {
    return 'or';
  }

  return 'base';
}

function getRows(progresses: CharacterProgress[]): AffinityRow[] {
  const byKey = new Map(
    progresses.map(progress => [progress.characterKey, progress])
  );

  return [
    {
      key: CharacterKey.Darkness,
      label: 'Darkness',
      affinity: Number(byKey.get(CharacterKey.Darkness)?.affinity || 0),
    },
    {
      key: CharacterKey.Megumin,
      label: 'Megumin',
      affinity: Number(byKey.get(CharacterKey.Megumin)?.affinity || 0),
    },
    {
      key: CharacterKey.Aqua,
      label: 'Aqua',
      affinity: Number(byKey.get(CharacterKey.Aqua)?.affinity || 0),
    },
  ];
}

export async function buildAffinitySvg(
  userId: string,
  progresses: CharacterProgress[],
  fr: boolean,
  hasEmbeddedFont = false
): Promise<string> {
  void userId;
  const rows = getRows(progresses);
  const totalAffinity = rows.reduce((acc, row) => acc + row.affinity, 0);
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';

  const rowY = [180, 300, 420];
  const rowText = rows
    .map((row, idx) => {
      const stars = getAffinityStars(row.affinity);
      const tier = getAffinityTier(stars);
      return `
      <rect x="36" y="${rowY[idx] - 50}" width="1028" height="100" rx="14" fill="#0f1729" fill-opacity="0.74" />
      <text x="170" y="${rowY[idx] - 10}" fill="#f5f7ff" font-size="34" font-family="${fontFamily}">${escapeXml(row.label)}</text>
      <text x="1030" y="${rowY[idx] - 10}" text-anchor="end" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${row.affinity}/100 AP</text>
      <text x="170" y="${rowY[idx] + 24}" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? `Rang: ${getTierLabel(fr, tier)}` : `Tier: ${tier}`)}</text>
    `;
          // <text x="1030" y="${rowY[idx] + 24}" text-anchor="end" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${stars}/${STAR_SLOT_COUNT}</text>
    })
    .join('');

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect x="24" y="24" width="1052" height="${HEIGHT - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="82" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(fr ? 'Affinite' : 'Affinity')}</text>
    <text x="36" y="116" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(fr ? `Total equipe: ${totalAffinity}` : `Team total: ${totalAffinity}`)}</text>
    ${rowText}
  </svg>`;
}

export async function renderAffinityImage(
  userId: string,
  progresses: CharacterProgress[],
  fr: boolean
): Promise<Uint8Array> {
  await ensureResvgWasm();
  const rows = getRows(progresses);
  const fontBuffer = await getEmbeddedFontBuffer();
  const svg = await buildAffinitySvg(
    userId,
    progresses,
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

  const [starEnabledBytes, starDisabledBytes] = await Promise.all([
    getAssetBytes(STAR_ENABLED_PATH),
    getAssetBytes(STAR_DISABLED_PATH),
  ]);

  const badgeBuffers = await Promise.all(
    rows.map(row =>
      getAssetBytes(
        getCharacterBadgePath(row.key, getAffinityStars(row.affinity))
      )
    )
  );

  const rowY = [180, 300, 420];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    const row = rows[rowIdx];
    const stars = getAffinityStars(row.affinity);

    const badgeBuffer = badgeBuffers[rowIdx];
    if (badgeBuffer) {
      let badge: Photon.PhotonImage | null = null;
      let badgeResized: Photon.PhotonImage | null = null;

      try {
        badge = Photon.PhotonImage.new_from_byteslice(
          new Uint8Array(badgeBuffer)
        );
        badgeResized = Photon.resize(
          badge,
          96,
          96,
          Photon.SamplingFilter.Lanczos3
        );
        Photon.watermark(canvas, badgeResized, 48n, BigInt(rowY[rowIdx] - 62));
      } catch {
        // Keep the row even when a badge image fails to decode.
      } finally {
        badgeResized?.free();
        badge?.free();
      }
    }

    for (let starIdx = 0; starIdx < STAR_SLOT_COUNT; starIdx += 1) {
      const shouldEnable = starIdx < stars;
      const starBuffer = shouldEnable ? starEnabledBytes : starDisabledBytes;
      if (!starBuffer) {
        continue;
      }

      let star: Photon.PhotonImage | null = null;
      let starResized: Photon.PhotonImage | null = null;

      try {
        star = Photon.PhotonImage.new_from_byteslice(
          new Uint8Array(starBuffer)
        );
        starResized = Photon.resize(
          star,
          36,
          36,
          Photon.SamplingFilter.Lanczos3
        );
        Photon.watermark(
          canvas,
          starResized,
          BigInt(170 + starIdx * 44),
          BigInt(rowY[rowIdx] + 30)
        );
      } catch {
        // Keep text rendering if one star icon fails to decode.
      } finally {
        starResized?.free();
        star?.free();
      }
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
