import * as Photon from '@cf-wasm/photon';
import { GenericCreature } from '../classes/GenericCreature';
import { Random } from '../classes/Random';
import { BASE_URL } from '../objects/config/constants';
import { generateMob } from '../objects/data/mobMap';
import { CharacterKey } from '../objects/enums/CharacterKey';
import { CharacterProgress } from '../objects/types/CharacterProgress';
import { PlayerProfile } from '../objects/types/PlayerProfile';
import { PlayerRunSummary } from '../objects/types/PlayerRunSummary';
import { getAssetBytes, getEmbeddedFontBuffer as getEmbeddedFontBufferUtil } from './assetLoader';
import { createPerfLogger } from './perfLogger';
import { getImageBytes as getImageBytesFromManifest } from './renderImage';
import { escapeXml } from './renderImageHelpers';
import { ensureResvgWasm, renderSvgToPng } from './resvgWasm';

type ProfileImageGlobals = {
  __starEnabledImage?: Photon.PhotonImage;
  __starDisabledImage?: Photon.PhotonImage;
  __boardImageResized?: Photon.PhotonImage;
  __badgeImageCache?: Record<string, Photon.PhotonImage>;
};

const G = globalThis as unknown as ProfileImageGlobals;
G.__badgeImageCache ??= {};

const ASSET_BASE_URL = BASE_URL;
const FONT_URL = `${ASSET_BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`;
const BOARD_PATH = '/assets/swordgame/art/board.webp';
const WIDTH = 1100;
const HEIGHT = 920;
const STAR_ENABLED_PATH = '/assets/star-enabled.webp';
const STAR_DISABLED_PATH = '/assets/star-disabled.webp';
const STAR_SLOT_COUNT = 5;
const AFFINITY_POINTS_PER_STAR = 20;

const MONSTER_ICON_DEFAULT_KEY = 'enemy_image_17700';
const monsterIconKeyByName: Record<string, string> = {};
let monsterIconMappingInitialized = false;

function normalizeMonsterName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function getMonsterIconKey(name: string): string {
  if (!monsterIconMappingInitialized) {
    monsterIconMappingInitialized = true;
    const mobs = generateMob();
    mobs.forEach(mob => {
      const mobName = normalizeMonsterName(mob.name?.[0] || '');
      if (!mobName) {
        return;
      }

      const rng = new Random(0);
      if (mob instanceof GenericCreature) {
        mob.pickColor(rng);
      }

      const key = mob.images?.[0];
      if (key) {
        monsterIconKeyByName[mobName] = key;
      }
    });
  }

  const normalized = normalizeMonsterName(name);
  return monsterIconKeyByName[normalized] || MONSTER_ICON_DEFAULT_KEY;
}

function getAffinityStars(affinity: number): number {
  const safeAffinity = Math.max(0, affinity);
  const stars = Math.floor(safeAffinity / AFFINITY_POINTS_PER_STAR);
  return Math.max(0, Math.min(STAR_SLOT_COUNT, stars));
}

function getCharacterBadgePath(key: CharacterKey, stars: number): string {
  const badgeStars = Math.max(1, Math.min(5, stars || 1));
  return `/assets/characters-emojis/${key}_${badgeStars}_star.webp`;
}

async function getEmbeddedFontBuffer(): Promise<Uint8Array | null> {
  return getEmbeddedFontBufferUtil('assets/swordgame/font/GintoNordMedium.otf', FONT_URL);
}

async function getCachedPhotonImage(path: string): Promise<Photon.PhotonImage | null> {
  const bytes = await getAssetBytes(path, ASSET_BASE_URL);
  if (!bytes) return null;
  try {
    return Photon.PhotonImage.new_from_byteslice(new Uint8Array(bytes));
  } catch {
    return null;
  }
}

async function initializeStarAssets() {
  if (G.__starEnabledImage && G.__starDisabledImage) {
    return { enabled: G.__starEnabledImage, disabled: G.__starDisabledImage };
  }

  const [enabledImg, disabledImg] = await Promise.all([getCachedPhotonImage(STAR_ENABLED_PATH), getCachedPhotonImage(STAR_DISABLED_PATH)]);
  if (enabledImg) G.__starEnabledImage = enabledImg;
  if (disabledImg) G.__starDisabledImage = disabledImg;
  return { enabled: enabledImg, disabled: disabledImg };
}

async function getResizedBoard(): Promise<Photon.PhotonImage | null> {
  if (G.__boardImageResized) {
    return G.__boardImageResized;
  }

  const boardImg = await getCachedPhotonImage(BOARD_PATH);
  if (!boardImg) return null;

  const resized = Photon.resize(boardImg, WIDTH, HEIGHT, Photon.SamplingFilter.Lanczos3);
  G.__boardImageResized = resized;
  boardImg.free();
  return resized;
}

function getRows(progresses: CharacterProgress[]) {
  const byKey = new Map(progresses.map(progress => [progress.characterKey, progress]));

  return [
    {
      key: CharacterKey.Darkness,
      label: 'Darkness',
      xp: Number(byKey.get(CharacterKey.Darkness)?.xp || 0),
      level: Number(byKey.get(CharacterKey.Darkness)?.level || 1),
      affinity: Number(byKey.get(CharacterKey.Darkness)?.affinity || 0),
    },
    {
      key: CharacterKey.Megumin,
      label: 'Megumin',
      xp: Number(byKey.get(CharacterKey.Megumin)?.xp || 0),
      level: Number(byKey.get(CharacterKey.Megumin)?.level || 1),
      affinity: Number(byKey.get(CharacterKey.Megumin)?.affinity || 0),
    },
    {
      key: CharacterKey.Aqua,
      label: 'Aqua',
      xp: Number(byKey.get(CharacterKey.Aqua)?.xp || 0),
      level: Number(byKey.get(CharacterKey.Aqua)?.level || 1),
      affinity: Number(byKey.get(CharacterKey.Aqua)?.affinity || 0),
    },
  ];
}

export async function buildProfileSvg(userId: string, profile: PlayerProfile, progresses: CharacterProgress[], runSummary: PlayerRunSummary, achievementsCount: number, totalAchievements: number, fr: boolean, hasEmbeddedFont = false): Promise<string> {
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';
  const title = fr ? 'Profil' : 'Profile';
  const teamAffinity = progresses.reduce((sum, p) => sum + p.affinity, 0);

  const rowY = [320, 435, 550];
  const keyRows = getRows(progresses);
  const characterLines = keyRows
    .map((row, idx) => {
      const stars = getAffinityStars(row.affinity);
      return `
      <rect x="36" y="${rowY[idx] - 54}" width="1028" height="94" rx="14" fill="#0f1729" fill-opacity="0.74" />
      <text x="170" y="${rowY[idx] - 12}" fill="#f5f7ff" font-size="32" font-family="${fontFamily}">${escapeXml(row.label)}</text>
      <text x="170" y="${rowY[idx] + 18}" fill="#9db0e8" font-size="19" font-family="${fontFamily}">${escapeXml(fr ? `Niv. ${row.level} | XP ${row.xp}` : `Lv. ${row.level} | XP ${row.xp}`)}</text>
      <text x="1030" y="${rowY[idx] - 12}" text-anchor="end" fill="#d8e1ff" font-size="22" font-family="${fontFamily}">${escapeXml(fr ? `Affinite: ${row.affinity}` : `Affinity: ${row.affinity}`)}</text>
      <text x="1030" y="${rowY[idx] + 18}" text-anchor="end" fill="#9db0e8" font-size="19" font-family="${fontFamily}">${escapeXml(fr ? `${stars}/5 etoiles` : `${stars}/5 stars`)}</text>`;
    })
    .join('');

  const recentMonsters = runSummary.killedMonsters.slice(0, 4);
  const recentMonsterRows = recentMonsters
    .map((monster, idx) => {
      const y = 738 + idx * 38;
      return `
      <text x="84" y="${y}" fill="#e7ebff" font-size="18" font-family="${fontFamily}">${escapeXml(`${monster.name} x${monster.count}`)}</text>`;
    })
    .join('');

  const nextLevelXp = profile.level * 100;
  const levelFactor = (1 + 0.2 * (Math.max(profile.level, 1) - 1)).toFixed(1);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect x="24" y="24" width="1052" height="${HEIGHT - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="36" y="78" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)}</text>
    <text x="36" y="112" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(fr ? 'Stats de joueur' : 'Player stats')}</text>

    <text x="52" y="160" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `Niveau: ${profile.level}` : `Level: ${profile.level}`)}</text>
    <text x="300" y="160" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `XP: ${profile.xp}/${nextLevelXp}` : `XP: ${profile.xp}/${nextLevelXp}`)}</text>
    <text x="560" y="160" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `Or: ${profile.gold}` : `Gold: ${profile.gold}`)}</text>
    <text x="840" y="160" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `Facteur: x${levelFactor}` : `Factor: x${levelFactor}`)}</text>
    <text x="52" y="196" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? `Parties jouées: ${runSummary.totalRuns}` : `Games played: ${runSummary.totalRuns}`)}</text>
    <text x="300" y="196" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? `Affinite équipe: ${teamAffinity}` : `Team affinity: ${teamAffinity}`)}</text>
    <text x="580" y="196" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? `Succès: ${achievementsCount}/${totalAchievements}` : `Achievements: ${achievementsCount}/${totalAchievements}`)}</text>

    ${characterLines}

    <rect x="36" y="650" width="1028" height="220" rx="14" fill="#0f1729" fill-opacity="0.74" />
    <text x="52" y="688" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? 'Monstres recemment battus:' : 'Recent defeated monsters:')}</text>
    ${recentMonsters.length > 0 ? recentMonsterRows : `<text x="52" y="738" fill="#e7ebff" font-size="18" font-family="${fontFamily}">${escapeXml(fr ? 'Aucun monstre battu' : 'No monsters defeated')}</text>`}
  </svg>`;
}

export async function renderProfileImage(userId: string, profile: PlayerProfile, progresses: CharacterProgress[], runSummary: PlayerRunSummary, achievementsCount: number, totalAchievements: number, fr: boolean): Promise<Uint8Array> {
  const perf = createPerfLogger('renderProfileImage');
  await ensureResvgWasm();
  perf.mark('ensureResvgWasm');

  const fontBuffer = await getEmbeddedFontBuffer();
  perf.mark('getEmbeddedFontBuffer');

  const svg = await buildProfileSvg(userId, profile, progresses, runSummary, achievementsCount, totalAchievements, fr, Boolean(fontBuffer));
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

  const png = await renderSvgToPng(svg, options);
  perf.mark('Resvg render -> PNG');

  const overlay = Photon.PhotonImage.new_from_byteslice(new Uint8Array(png.buffer.slice(0) as ArrayBuffer));

  const rows = getRows(progresses);
  
  // Parallelize all asset loading: board + stars + badges
  const [resizedBoard, starAssets, badgeBuffers] = await Promise.all([
    getResizedBoard(),
    initializeStarAssets(),
    Promise.all(rows.map(row => getAssetBytes(getCharacterBadgePath(row.key, getAffinityStars(row.affinity)), ASSET_BASE_URL)))
  ]);
  perf.mark('get all assets');

  // Use pre-resized board
  let canvas: Photon.PhotonImage;
  if (resizedBoard) {
    canvas = Photon.resize(resizedBoard, WIDTH, HEIGHT, Photon.SamplingFilter.Lanczos3);
    Photon.watermark(canvas, overlay, 0n, 0n);
  } else {
    canvas = overlay;
  }

  // Pre-create and cache resized star images
  const starEnabledResized = starAssets.enabled ? Photon.resize(starAssets.enabled, 28, 28, Photon.SamplingFilter.Lanczos3) : null;
  const starDisabledResized = starAssets.disabled ? Photon.resize(starAssets.disabled, 28, 28, Photon.SamplingFilter.Lanczos3) : null;
  perf.mark('prepare star assets');

  // Pre-decode and cache badge images
  const badgeImagesMap = new Map<string, Photon.PhotonImage>();
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    const badgeBuffer = badgeBuffers[rowIdx];
    if (badgeBuffer) {
      const badgePath = getCharacterBadgePath(rows[rowIdx].key, getAffinityStars(rows[rowIdx].affinity));
      if (!badgeImagesMap.has(badgePath)) {
        try {
          const badgeImg = Photon.PhotonImage.new_from_byteslice(new Uint8Array(badgeBuffer));
          badgeImagesMap.set(badgePath, badgeImg);
        } catch {
          // Skip on decode failure
        }
      }
    }
  }
  perf.mark('prepare badges');

  // Compose overlays more efficiently
  const rowY = [320, 435, 550];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    const stars = getAffinityStars(rows[rowIdx].affinity);
    const badgePath = getCharacterBadgePath(rows[rowIdx].key, stars);
    const badgeImage = badgeImagesMap.get(badgePath);

    if (badgeImage) {
      try {
        const badgeResized = Photon.resize(badgeImage, 84, 84, Photon.SamplingFilter.Lanczos3);
        Photon.watermark(canvas, badgeResized, 48n, BigInt(rowY[rowIdx] - 64));
        badgeResized.free();
      } catch {
        // Keep row even if badge fails
      }
    }

    // Use pre-resized stars
    for (let starIdx = 0; starIdx < STAR_SLOT_COUNT; starIdx += 1) {
      const shouldEnable = starIdx < stars;
      const starImage = shouldEnable ? starEnabledResized : starDisabledResized;
      if (starImage) {
        try {
          Photon.watermark(canvas, starImage, BigInt(170 + starIdx * 34), BigInt(rowY[rowIdx] + 20));
        } catch {
          // Continue on watermark failure
        }
      }
    }
  }

  // Render mini monster icons before each monster name line - parallelize fetches
  const iconSize = 18;
  const monsterStartY = 738;
  const monsterIconFetches = runSummary.killedMonsters.slice(0, 4).map((monster, idx) => ({
    idx,
    name: monster.name,
    key: getMonsterIconKey(monster.name),
    y: monsterStartY + idx * 36,
  }));

  for (const monsterInfo of monsterIconFetches) {
    try {
      const iconBytes = await getImageBytesFromManifest(monsterInfo.key);
      if (iconBytes) {
        const iconImage = Photon.PhotonImage.new_from_byteslice(new Uint8Array(iconBytes));
        const icon = Photon.resize(iconImage, iconSize, iconSize, Photon.SamplingFilter.Lanczos3);
        Photon.watermark(canvas, icon, 52n, BigInt(monsterInfo.y - 15));
        icon.free();
        iconImage.free();
      }
    } catch {
      // If icon missing or invalid, ignore and continue.
    }
  }
  perf.mark('compose overlays');

  const output = new Uint8Array(canvas.get_bytes());
  if (canvas !== overlay) {
    overlay.free();
  }

  // Cleanup resized bed global assets only on error, keep for reuse
  starEnabledResized?.free();
  starDisabledResized?.free();
  badgeImagesMap.forEach(img => img.free());
  canvas.free();
  perf.done();
  return output;
}
