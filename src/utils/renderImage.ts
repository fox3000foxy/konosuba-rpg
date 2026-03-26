import * as Photon from '@cf-wasm/photon';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import satori from 'satori';
import { Creature } from '../classes/Creature';
import { Team } from '../classes/Player';
import { imageManifest } from '../data/imageManifest';
import { EndMessages } from '../enums/EndMessages';
import { HealthBarName } from '../enums/HealthBarName';
import { Lang } from '../enums/Lang';
import { Prefix } from '../enums/Prefix';
import { RetryMessages } from '../enums/RetryMessages';
import { AquaImages } from '../enums/player/AquaImages';
import { DarknessImages } from '../enums/player/DarknessImages';
import { KazumaImages } from '../enums/player/KazumaImages';
import { MeguminImages } from '../enums/player/MeguminImages';
import { PlayerName } from '../enums/player/PlayerName';

// ─── WASM init (once per Worker lifetime) ────────────────────────────────────
let wasmReady = false;
async function ensureWasm(): Promise<void> {
  if (wasmReady) return;

  await initWasm(await fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm').then((r) => r.arrayBuffer()));
  console.log('WASM initialized (dev)');
  wasmReady = true;
  return;
}

// ─── GLOBAL CACHE (survit aux re-imports en dev/hot-reload) ──────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GLOBAL = globalThis as any;

GLOBAL.__imageCache ??= {} as Record<string, ArrayBuffer>;
GLOBAL.__base64Cache ??= {} as Record<string, string>;          // base64 des end-images, calculé une fois par état
GLOBAL.__photonCache ??= new Map<string, Photon.PhotonImage>(); // sprites décodés/flippés/resizés
GLOBAL.__layerCache ??= new Map<string, Photon.PhotonImage>(); // bg + characters composités
GLOBAL.__uiPhotonCache ??= new Map<string, Photon.PhotonImage>(); // overlay UI parsé en PhotonImage (évite le re-parse PNG)
GLOBAL.__fontCache ??= {} as Record<string, ArrayBuffer>;

const imageCache: Record<string, ArrayBuffer> = GLOBAL.__imageCache;
const base64Cache: Record<string, string> = GLOBAL.__base64Cache;
const photonCache: Map<string, Photon.PhotonImage> = GLOBAL.__photonCache;
const layerCache: Map<string, Photon.PhotonImage> = GLOBAL.__layerCache;
const uiPhotonCache: Map<string, Photon.PhotonImage> = GLOBAL.__uiPhotonCache;
const fontCache: Record<string, ArrayBuffer> = GLOBAL.__fontCache;

// ─── Image / Font cache ───────────────────────────────────────────────────────

export async function getImageBytes(key: string): Promise<ArrayBuffer> {
  if (imageCache[key]) return imageCache[key];
  const url: string = imageManifest[key];
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image "${key}": ${resp.status}`);
  const buf = await resp.arrayBuffer();
  imageCache[key] = buf;
  return buf;
}

async function getFontBytes(url: string): Promise<ArrayBuffer> {
  if (fontCache[url]) return fontCache[url];
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  fontCache[url] = buf;
  return buf;
}

/**
 * Convertit un ArrayBuffer en base64, avec mise en cache par clé.
 * Évite de recalculer btoa() sur une même image d'état à chaque render.
 */
function getBase64Cached(key: string, buf: ArrayBuffer): string {
  if (base64Cache[key]) return base64Cache[key];
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  const b64 = btoa(binary);
  base64Cache[key] = b64;
  return b64;
}

// ─── Photon helpers ───────────────────────────────────────────────────────────

async function toPhoton(buf: ArrayBuffer): Promise<Photon.PhotonImage> {
  const bytes = new Uint8Array(buf);
  try {
    return Photon.PhotonImage.new_from_byteslice(bytes);
  } catch (err) {
    console.warn('Photon cannot decode bytes directly, trying fallback decoder:', err);
  }

  if (typeof createImageBitmap !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    const blob = new Blob([buf], { type: 'image/avif' });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas context could not be created');
    ctx.drawImage(bitmap, 0, 0);
    const fallbackBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 1 });
    const fallbackBuffer = await fallbackBlob.arrayBuffer();
    bitmap.close();
    return Photon.PhotonImage.new_from_byteslice(new Uint8Array(fallbackBuffer));
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const sharp = await import('sharp');
      const converted = await sharp.default(bytes).webp({ quality: 100 }).toBuffer();
      return Photon.PhotonImage.new_from_byteslice(new Uint8Array(converted));
    } catch (sharpErr) {
      console.warn('Sharp fallback failed:', sharpErr);
    }
  }

  throw new Error('Unsupported image format for PhotonImage (avif decode fallback failed).');
}

/**
 * Clone léger d'un PhotonImage : copie mémoire directe des pixels RGBA,
 * sans codec ni filtre. O(W×H), sans passer par WASM resize.
 */
function clonePhoton(img: Photon.PhotonImage): Photon.PhotonImage {
  return new Photon.PhotonImage(
    new Uint8Array(img.get_raw_pixels()),
    img.get_width(),
    img.get_height()
  );
}

function flipX(img: Photon.PhotonImage): Photon.PhotonImage {
  const w = img.get_width();
  const h = img.get_height();
  const raw = img.get_raw_pixels();
  const flipped = new Uint8Array(raw.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = (y * w + (w - 1 - x)) * 4;
      flipped[dst] = raw[src];
      flipped[dst + 1] = raw[src + 1];
      flipped[dst + 2] = raw[src + 2];
      flipped[dst + 3] = raw[src + 3];
    }
  }
  return new Photon.PhotonImage(flipped, w, h);
}

/**
 * Retourne un PhotonImage décodé/flippé/resizé depuis le cache.
 * Toujours retourné comme clone — l'entrée cache n'est jamais exposée ni mutée.
 */
async function getImage(key: string, w?: number, h?: number, flipped = false): Promise<Photon.PhotonImage> {
  const cacheKey = `${key}_${w ?? 0}_${h ?? 0}_${flipped}`;
  if (photonCache.has(cacheKey)) return clonePhoton(photonCache.get(cacheKey)!);

  let img = await toPhoton(await getImageBytes(key));

  if (flipped) {
    const f = flipX(img);
    img.free();
    img = f;
  }

  if (w && h) {
    const r = Photon.resize(img, w, h, Photon.SamplingFilter.Lanczos3);
    img.free();
    img = r;
  }

  // only h
  if (!w && h) {
    const ratio = img.get_width() / img.get_height();
    const newW = Math.round(h * ratio);
    const r = Photon.resize(img, newW, h, Photon.SamplingFilter.Lanczos3);
    img.free();
    img = r;
  }

  photonCache.set(cacheKey, img);
  return clonePhoton(img);
}

// ─── BACKGROUND LAYER ────────────────────────────────────────────────────────

async function getBackground(W: number, H: number): Promise<Photon.PhotonImage> {
  const key = `bg_${W}_${H}`;
  if (layerCache.has(key)) return clonePhoton(layerCache.get(key)!);

  const board = await getImage('board', W, H);
  const frame = await getImage('frameless', W, H);
  Photon.watermark(board, frame, 0n, 0n);
  frame.free();

  layerCache.set(key, board);
  return clonePhoton(board);
}

// ─── CHARACTERS LAYER ────────────────────────────────────────────────────────

async function getCharactersLayer(
  playerImages: string[][],
  playerHp: number[],
  creatureImages: string[],
  creatureHp: number,
  W: number,
  H: number
): Promise<Photon.PhotonImage> {
  const key = JSON.stringify({ playerImages, playerHp, creatureImages, creatureHp });
  if (layerCache.has(key)) return clonePhoton(layerCache.get(key)!);

  const layer = new Photon.PhotonImage(new Uint8Array(W * H * 4), W, H);

  const slots = [
    { i: 3, x: (W * 2) / 8 - 45, y: (H / 2 - 52 * 2) - 45 },
    { i: 2, x: (W * 2) / 8 + 75, y: (H / 2 - 52 * 2) - 45 },
    { i: 1, x: (W * 2) / 8 - 75, y: (H / 2 - 52 * 2) + 45 },
    { i: 0, x: (W * 2) / 8 + 50, y: (H / 2 - 52 * 2) + 45 },
  ];

  for (const s of slots) {
    if (playerHp[s.i] <= 0) continue;
    const img = await getImage(playerImages[s.i][0], undefined, 184, true);
    Photon.watermark(layer, img, BigInt(Math.round(s.x)), BigInt(Math.round(s.y)));
    img.free();
  }

  if (creatureHp > 0) {
    const img = await getImage(creatureImages[0], 400, 400, true);
    Photon.watermark(layer, img, BigInt(600), BigInt(Math.round(H / 2 - 240)));
    img.free();
  }

  layerCache.set(key, layer);
  return clonePhoton(layer);
}

// ─── UI OVERLAY ───────────────────────────────────────────────────────────────

async function buildOverlayJsx(
  team: Team,
  creature: Creature,
  messages: string[],
  state: string | null,
  lang: string,
  W: number,
  H: number
): Promise<object> {
  const hp = lang === Lang.French ? HealthBarName.French : HealthBarName.English;

  function healthBar(current: number, max: number, x: number, y: number, w: number, h: number) {
    const pct = Math.max(0, Math.min(1, current / max));
    return {
      type: 'div',
      props: {
        style: { position: 'absolute' as const, display: 'flex' as const, left: x, top: y, width: w, height: h, background: '#ff0000' },
        children: {
          type: 'div',
          props: { style: { width: Math.round(w * pct), height: h, background: '#00FF00' }, children: null },
        },
      },
    };
  }

  const endMsg = state ? ({
    "good": lang === Lang.French ? `${EndMessages.French_Good}${creature.prefix ? Prefix.French_Determined : Prefix.None}${creature.name}${EndMessages.French_ExclamationMark}` : `${EndMessages.English_Good}${creature.prefix ? Prefix.English_Determined : Prefix.None}${creature.name}${EndMessages.English_ExclamationMark}`,
    "bad": lang === Lang.French ? EndMessages.French_Bad : EndMessages.English_Bad,
    "giveup": lang === Lang.French ? EndMessages.French_Giveup : EndMessages.English_Giveup,
    "best": lang === Lang.French ? `${EndMessages.French_Best}${creature.prefix ? Prefix.French_Determined : Prefix.None}${creature.name}${EndMessages.French_ExclamationMark}` : `${EndMessages.English_Best}${creature.prefix ? Prefix.English_Determined : Prefix.None}${creature.name}${EndMessages.English_ExclamationMark}`,
  } as Record<string, string>)[state] : null;

  const endMsg2 = state ? ({
    "good": lang === Lang.French ? RetryMessages.French_Good : RetryMessages.English_Good,
    "bad": lang === Lang.French ? RetryMessages.French_Bad : RetryMessages.English_Bad,
    "giveup": lang === Lang.French ? RetryMessages.French_Giveup : RetryMessages.English_Giveup,
    "best": lang === Lang.French ? RetryMessages.French_Best : RetryMessages.English_Best,
  } as Record<string, string>)[state] : null;

  // base64 mis en cache par clé d'état — btoa() n'est appelé qu'une seule fois par état
  const endImgSrc = endMsg
    ? `data:image/png;base64,${getBase64Cached('end_' + state, await getImageBytes('end_' + state))}`
    : null;

  let pid: number = 0;
  switch (team.activePlayer?.name) {
    case PlayerName.Kazuma:
      pid = 0;
      break;
    case PlayerName.Aqua:
      pid = 1;
      break;
    case PlayerName.Megumin:
      pid = 2;
      break;
    case PlayerName.Darkness:
      pid = 3;
      break;
  }

  team.setActivePlayer(team.players[pid]);
  
  return {
    type: 'div',
    props: {
      style: { display: 'flex' as const, position: 'relative' as const, width: W, height: H, fontFamily: '"Ginto Nord Black"', color: '#000000', overflow: 'hidden' },
      children: [
        // ── Chat messages ──────────────────────────────────────────────
        ...messages.map((msg, i) => ({
          type: 'div',
          props: {
            style: { display: 'flex' as const, position: 'absolute' as const, left: 104, top: (192 + i * 16) * 2 + 120, fontSize: 20, fontFamily: '"Ginto Nord Black"', color: '#000000' },
            children: msg,
          },
        })),

        // ── Player info (main) ─────────────────────────────────────────
        { type: 'img', props: { src: team.activePlayer?.icon, style: { position: 'absolute' as const, left: 40 * 1.5 + 10, top: 40 + 10 - 38, width: 50, height: 50 } } },
        {
          type: 'div',
          props: {
            style: { display: 'flex' as const, position: 'absolute' as const, left: 40 * 2 + 40, top: 42 * 2 - 55, fontSize: 16, fontFamily: '"Ginto Nord Black"' },
            children: `${team.activePlayer?.name} (${Math.max(team.activePlayer?.hp || 0, 0)} ${hp})`,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex' as const, position: 'absolute' as const, right: W - 210 * 2, top: 42 * 2 - 55, fontSize: 16, fontFamily: '"Ginto Nord Medium"' },
            children: `${team.activePlayer?.attack[0]}-${team.activePlayer?.attack[1]}ATK`,
          },
        },
        healthBar(team.activePlayer?.hp || 0, team.activePlayer?.hpMax || 0, 38 * 2, 46.25 * 2 - 38, 173.5 * 2, 8.5 * 2),

        // ── Player info (secondary x3) ─────────────────────────────────
        ...[1, 2, 3].flatMap((offset) => {
          const i = (pid + offset) % 4;
          const xBase = offset === 2 ? 332 * 2 : 234 * 2;
          const yBase = offset === 3 ? 56.25 * 2 - 38 : 36 * 2 - 38 + 3;
          const thmX = offset === 2 ? 300 * 1.5 + 10 + 200 : 300 * 1.5 + 10;
          const thmY = offset === 3 ? 70 + 10 - 38 : 40 - 38;
          const offsetPlayer = team.players[i];
          // console.log(`Offset ${offset}: player ${i} (${offsetPlayer?.name}), hp ${offsetPlayer?.hp}/${offsetPlayer?.hpMax}`, offsetPlayer.icon);
          return [
            { type: 'img', props: { src: offsetPlayer?.icon, style: { position: 'absolute' as const, left: thmX, top: thmY, width: 40, height: 40 } } },
            {
              type: 'div',
              props: {
                style: { display: 'flex' as const, position: 'absolute' as const, left: xBase + 32, top: yBase - 16, fontSize: 12, fontFamily: '"Ginto Nord Black"' },
                children: `${offsetPlayer?.name} (${Math.max(offsetPlayer?.hp || 0, 0)} ${hp})`,
              },
            },
            healthBar(offsetPlayer?.hp || 0, offsetPlayer?.hpMax || 0, xBase, yBase, 173, 8.5),
          ];
        }),

        // ── Creature info ──────────────────────────────────────────────
        {
          type: 'div',
          props: {
            style: { display: 'flex' as const, position: 'absolute' as const, left: 288 * 2, top: 148 * 2 + 129, fontSize: 12, fontFamily: '"Ginto Nord Black"' },
            children: `${creature.name} (${creature.hp} ${hp})`,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex' as const, position: 'absolute' as const, right: W - 460 * 2, top: 148 * 2 + 129, fontSize: 12, fontFamily: '"Ginto Nord Medium"' },
            children: `${creature.attack[0]}-${creature.attack[1]}ATK`,
          },
        },
        healthBar(creature.hp, creature.hpMax, 286.5 * 2, 152 * 2 + 139, 173.5 * 2, 8.5 * 2),

        // ── End-state overlay ──────────────────────────────────────────
        ...(endMsg && endImgSrc ? [
          { type: 'img', props: { src: endImgSrc, style: { position: 'absolute' as const, left: 0, top: 0, width: '100%', height: '100%' } } },
          {
            type: 'div',
            props: {
              style: { display: 'flex' as const, position: 'absolute' as const, left: W / 2 - endMsg.length * 9, right: 0, top: 135 * 2 + 100, textAlign: 'center' as const, fontSize: 32, fontFamily: '"Ginto Nord Medium"', color: '#FFFFFF' },
              children: endMsg,
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex' as const, position: 'absolute' as const, left: W / 2 - (endMsg2?.length || 0) * 9, right: 0, top: 135 * 2 + 100 + 50, textAlign: 'center' as const, fontSize: 32, fontFamily: '"Ginto Nord Medium"', color: '#FFFFFF' },
              children: endMsg2,
            },
          },
        ] : []),
      ],
    },
  };
}

/**
 * Retourne le PhotonImage de l'overlay UI depuis le cache si possible,
 * sinon construit le JSX, passe par Satori → resvg → toPhoton, et met en cache.
 * Le cache est vérifié AVANT toute construction de JSX ou appel Satori.
 */
async function getUIOverlay(
  uiCacheKey: string,
  team: Team,
  creature: Creature,
  messages: string[],
  state: string | null,
  lang: string,
  fontMediumBuf: ArrayBuffer,
  W: number,
  H: number
): Promise<Photon.PhotonImage> {
  if (uiPhotonCache.has(uiCacheKey)) return clonePhoton(uiPhotonCache.get(uiCacheKey)!);

  const overlayJsx = await buildOverlayJsx(team, creature, messages, state, lang, W, H);

  const overlaySvg = await satori(overlayJsx, {
    width: W,
    height: H,
    fonts: [{ name: 'Sans-Serif', data: fontMediumBuf, weight: 400, style: 'normal' }],
  });

  const png = new Resvg(overlaySvg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  const img = await toPhoton(png.buffer.slice(0) as ArrayBuffer);

  uiPhotonCache.set(uiCacheKey, img);
  return clonePhoton(img);
}

// ─── Main render ─────────────────────────────────────────────────────────────

export default async function renderImage(
  state: string | null,
  messages: string[],
  team: Team,
  creature: Creature,
  lang = 'en'
): Promise<Uint8Array> {
  await ensureWasm();

  const W = 1000;
  const H = 600;

  if (creature.hp <= 0) {
    team.players[0].images = [KazumaImages.Hug];
    team.players[1].images = [DarknessImages.Hug];
    team.players[2].images = [MeguminImages.Hug];
    team.players[3].images = [AquaImages.Hug];
  }
  creature.hp = Math.max(creature.hp, 0);

  // Clé de cache UI calculée une seule fois ici, avant tout travail
  const uiCacheKey = JSON.stringify({
    hp: team.players[0].hp, hpMax: team.players[0].hpMax, attack: team.players[0].attack, name: team.players[0].name,
    pid: team.players[0],
    cHp: creature.hp, cHpMax: creature.hpMax, cAttack: creature.attack, cName: creature.name,
    messages, state, lang,
  });

  // Fonts mises en cache — quasi-instantané après le premier appel
  const [, fontMediumBuf] = await Promise.all([
    getFontBytes('https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/swordgame/font/GintoNordBlack.otf'),
    getFontBytes('https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/swordgame/font/GintoNordMedium.otf'),
  ]);

  const playerImages = [...team.players.map((p) => p.images)];
  const teamHp = [...team.players.map((p) => p.hp)];

  // Les trois layers en parallèle — chacun court-circuite son propre cache si possible
  const [canvas, chars, uiImg] = await Promise.all([
    getBackground(W, H),
    getCharactersLayer(playerImages, teamHp, creature.images, creature.hp, W, H),
    getUIOverlay(uiCacheKey, team, creature, messages, state, lang, fontMediumBuf, W, H),
  ]);

  Photon.watermark(canvas, chars, 0n, 0n);
  chars.free();

  Photon.watermark(canvas, uiImg, 0n, 0n);
  uiImg.free();

  const output = canvas.get_bytes_webp();
  const outputUint8 = new Uint8Array(output);
  canvas.free();
  return outputUint8;
}