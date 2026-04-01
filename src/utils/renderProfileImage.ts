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
import { getImageBytes as getImageBytesFromManifest } from './renderImage';
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
const HEIGHT = 720;

const MONSTER_ICON_DEFAULT_KEY = 'enemy_image_17700';
const monsterIconKeyByName: Record<string, string> = {};

function normalizeMonsterName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function getMonsterIconKey(name: string): string {
  const normalized = normalizeMonsterName(name);
  return monsterIconKeyByName[normalized] || MONSTER_ICON_DEFAULT_KEY;
}

(function initMonsterIconMapping() {
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
})();
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

export async function buildProfileSvg(
  userId: string,
  profile: PlayerProfile,
  progresses: CharacterProgress[],
  runSummary: PlayerRunSummary,
  achievementsCount: number,
  totalAchievements: number,
  fr: boolean,
  hasEmbeddedFont = false
): Promise<string> {
  void userId;
  const fontFamily = hasEmbeddedFont ? 'GintoNordMedium' : 'Arial';
  const title = fr ? 'Profil' : 'Profile';
  const teamAffinity = progresses.reduce((sum, p) => sum + p.affinity, 0);

  const rowY = [240, 300, 360, 420];
  const keyRows = getRows(progresses);
  const characterLines = keyRows
    .map((row, idx) => {
      return `
      <text x="52" y="${rowY[idx]}" fill="#f5f7ff" font-size="24" font-family="${fontFamily}">${escapeXml(row.label)}: Lv ${row.level} | XP ${row.xp} | Aff ${row.affinity}</text>`;
    })
    .join('');

  const recentMonsters = runSummary.killedMonsters
    .slice(0, 4)
    .map(m => `${m.name} x${m.count}`)
    .join(', ') || (fr ? 'Aucun monstre battu' : 'No monsters defeated');

  const nextLevelXp = profile.level * 100;
  const levelFactor = (1 + 0.2 * (Math.max(profile.level, 1) - 1)).toFixed(1);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect x="24" y="24" width="1052" height="${HEIGHT - 48}" rx="16" fill="#070c1b" fill-opacity="0.76" stroke="#34405e" stroke-opacity="0.9" />
    <text x="52" y="80" fill="#ffffff" font-size="42" font-family="${fontFamily}">${escapeXml(title)} - ${escapeXml(userId)}</text>
    <text x="52" y="120" fill="#b2bdd6" font-size="18" font-family="${fontFamily}">${escapeXml(fr ? 'Stats de joueur' : 'Player stats')}</text>

    <text x="52" y="170" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `Niveau: ${profile.level}` : `Level: ${profile.level}`)}</text>
    <text x="300" y="170" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `XP: ${profile.xp}/${nextLevelXp}` : `XP: ${profile.xp}/${nextLevelXp}`)}</text>
    <text x="560" y="170" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `Or: ${profile.gold}` : `Gold: ${profile.gold}`)}</text>
    <text x="840" y="170" fill="#d8e1ff" font-size="24" font-family="${fontFamily}">${escapeXml(fr ? `Facteur: x${levelFactor}` : `Factor: x${levelFactor}`)}</text>
    <text x="52" y="205" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? `Parties jouées: ${runSummary.totalRuns}` : `Games played: ${runSummary.totalRuns}`)}</text>
    <text x="300" y="205" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? `Affinite équipe: ${teamAffinity}` : `Team affinity: ${teamAffinity}`)}</text>
    <text x="580" y="205" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? `Succès: ${achievementsCount}/${totalAchievements}` : `Achievements: ${achievementsCount}/${totalAchievements}`)}</text>

    ${characterLines}

    <text x="52" y="500" fill="#9db0e8" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? 'Monstres récemment battus:' : 'Recent defeated monsters:')}</text>
    <text x="52" y="530" fill="#e7ebff" font-size="20" font-family="${fontFamily}">${escapeXml(fr ? 'Icônes en bas à gauche' : 'Icons in the lower-left')}</text>
  </svg>`;
}

export async function renderProfileImage(
  userId: string,
  profile: PlayerProfile,
  progresses: CharacterProgress[],
  runSummary: PlayerRunSummary,
  achievementsCount: number,
  totalAchievements: number,
  fr: boolean
): Promise<Uint8Array> {
  await ensureResvgWasm();
  const fontBuffer = await getEmbeddedFontBuffer();
  const svg = await buildProfileSvg(
    userId,
    profile,
    progresses,
    runSummary,
    achievementsCount,
    totalAchievements,
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
    canvas = Photon.resize(board, WIDTH, HEIGHT, Photon.SamplingFilter.Lanczos3);
    Photon.watermark(canvas, overlay, 0n, 0n);
  } else {
    canvas = overlay;
  }

  // Render minified monster icons (instead of text names) in profile graphic
  const iconSize = 24;
  const monsterRowY = 545;
  let iconX = 52;

  for (const monster of runSummary.killedMonsters.slice(0, 6)) {
    const iconKey = getMonsterIconKey(monster.name);

    try {
      const iconBytes = await getImageBytesFromManifest(iconKey);
      if (iconBytes) {
        const iconImage = Photon.PhotonImage.new_from_byteslice(new Uint8Array(iconBytes));
        const icon = Photon.resize(iconImage, iconSize, iconSize, Photon.SamplingFilter.Lanczos3);
        Photon.watermark(canvas, icon, BigInt(iconX), BigInt(monsterRowY - iconSize));
        icon.free();
        iconImage.free();

        // Draw count number with text in SVG running by doing on-canvas overlay with simple rectangle + text.
        const countX = iconX + iconSize + 10;
        const countText = `${monster.count}`;

        const xScale = 1; // no transform needed for x, straightforward placement
        const yScale = 1;

        // Since Photon has no direct text rendering, we keep this text in base SVG; still, marker is as a text hint.
        // For count overlay, we can keep using text in diagram by rendering in SVG directly if necessary.
      }
    } catch {
      // If icon missing or invalid, ignore and continue.
    }

    iconX += iconSize + 60;
  }

  const output = new Uint8Array(canvas.get_bytes());
  if (canvas !== overlay) {
    overlay.free();
  }

  board?.free();
  canvas.free();
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
