import * as Photon from '@cf-wasm/photon';
import { Resvg } from '@resvg/resvg-wasm';
import { GenericCreature } from '../classes/GenericCreature';
import { Random } from '../classes/Random';
import { BASE_URL } from '../objects/config/constants';
import { generateMob } from '../objects/data/mobMap';
import { CharacterKey } from '../objects/enums/CharacterKey';
import { CharacterProgress } from '../objects/types/CharacterProgress';
import { PlayerProfile } from '../objects/types/PlayerProfile';
import { PlayerRunSummary } from '../objects/types/PlayerRunSummary';
import { createPerfLogger } from './perfLogger';
import { getImageBytes as getImageBytesFromManifest } from './renderImage';
import { escapeXml } from './renderImageHelpers';
import { ensureResvgWasm } from './resvgWasm';

type ProfileImageGlobals = {
  __profileIconCache?: Record<string, ArrayBuffer>;
  __profileFontBuffer?: Uint8Array;
};

const G = globalThis as unknown as ProfileImageGlobals;
G.__profileIconCache ??= {};
const iconCache = G.__profileIconCache;

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
  if (G.__profileFontBuffer) {
    return G.__profileFontBuffer;
  }

  const response = await fetch(FONT_URL);
  if (!response.ok) {
    return null;
  }

  const fontBuffer = await response.arrayBuffer();
  const fontBytes = new Uint8Array(fontBuffer);
  G.__profileFontBuffer = fontBytes;
  return fontBytes;
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

  const png = new Resvg(svg, options).render().asPng();
  perf.mark('Resvg render -> PNG');

  const overlay = Photon.PhotonImage.new_from_byteslice(new Uint8Array(png.buffer.slice(0) as ArrayBuffer));

  let board: Photon.PhotonImage | null = null;
  let canvas: Photon.PhotonImage;
  const boardBytes = await getAssetBytes(BOARD_PATH);
  perf.mark('get board');

  if (boardBytes) {
    board = Photon.PhotonImage.new_from_byteslice(new Uint8Array(boardBytes));
    canvas = Photon.resize(board, WIDTH, HEIGHT, Photon.SamplingFilter.Lanczos3);
    Photon.watermark(canvas, overlay, 0n, 0n);
  } else {
    canvas = overlay;
  }

  const rows = getRows(progresses);
  const [starEnabledBytes, starDisabledBytes] = await Promise.all([getAssetBytes(STAR_ENABLED_PATH), getAssetBytes(STAR_DISABLED_PATH)]);
  perf.mark('get star assets');

  const badgeBuffers = await Promise.all(rows.map(row => getAssetBytes(getCharacterBadgePath(row.key, getAffinityStars(row.affinity)))));
  perf.mark('get badges');

  const rowY = [320, 435, 550];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    const stars = getAffinityStars(rows[rowIdx].affinity);
    const badgeBuffer = badgeBuffers[rowIdx];
    if (badgeBuffer) {
      let badge: Photon.PhotonImage | null = null;
      let badgeResized: Photon.PhotonImage | null = null;

      try {
        badge = Photon.PhotonImage.new_from_byteslice(new Uint8Array(badgeBuffer));
        badgeResized = Photon.resize(badge, 84, 84, Photon.SamplingFilter.Lanczos3);
        Photon.watermark(canvas, badgeResized, 48n, BigInt(rowY[rowIdx] - 64));
      } catch {
        // Keep row even if badge fails to decode
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
        star = Photon.PhotonImage.new_from_byteslice(new Uint8Array(starBuffer));
        starResized = Photon.resize(star, 28, 28, Photon.SamplingFilter.Lanczos3);
        Photon.watermark(canvas, starResized, BigInt(170 + starIdx * 34), BigInt(rowY[rowIdx] + 20));
      } catch {
        // Keep row text even if star icon fails to decode
      } finally {
        starResized?.free();
        star?.free();
      }
    }
  }

  // Render mini monster icons before each monster name line.
  const iconSize = 18;
  const monsterStartY = 738;

  for (const [idx, monster] of runSummary.killedMonsters.slice(0, 4).entries()) {
    const iconKey = getMonsterIconKey(monster.name);
    const iconY = monsterStartY + idx * 36;

    try {
      const iconBytes = await getImageBytesFromManifest(iconKey);
      if (iconBytes) {
        const iconImage = Photon.PhotonImage.new_from_byteslice(new Uint8Array(iconBytes));
        const icon = Photon.resize(iconImage, iconSize, iconSize, Photon.SamplingFilter.Lanczos3);
        Photon.watermark(canvas, icon, 52n, BigInt(iconY - 15));
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

  board?.free();
  canvas.free();
  perf.done();
  return output;
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
