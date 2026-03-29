import * as Photon from '@cf-wasm/photon';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import satori from 'satori';
import { Creature } from '../classes/Creature';
import { Team } from '../classes/Player';
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
import { imageManifest } from '../objects/data/imageManifest';

// ─── LRU Cache ───────────────────────────────────────────────────────────────

class LRUCache<K, V> {
  private map = new Map<K, V>();

  constructor(
    private maxSize: number,
    private onEvict?: (key: K, val: V) => void
  ) {}

  has(key: K): boolean {
    return this.map.has(key);
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key: K, val: V): void {
    if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value as K;
      this.onEvict?.(firstKey, this.map.get(firstKey)!);
      this.map.delete(firstKey);
    }
    this.map.set(key, val);
  }

  delete(key: K): void {
    if (this.map.has(key)) {
      this.onEvict?.(key, this.map.get(key)!);
      this.map.delete(key);
    }
  }

  get size(): number {
    return this.map.size;
  }
}

function freePhoton(_key: string, img: Photon.PhotonImage): void {
  try {
    img.free();
  } catch {
    /* already freed */
  }
}

// ─── Global caches ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const G = globalThis as any;

G.__imageCache ??= {} as Record<string, ArrayBuffer>;
G.__base64Cache ??= {} as Record<string, string>;
G.__fontCache ??= {} as Record<string, ArrayBuffer>;
G.__photonCache ??= new LRUCache<string, Photon.PhotonImage>(40, freePhoton);
G.__layerCache ??= new LRUCache<string, Photon.PhotonImage>(12, freePhoton);
G.__uiPhotonCache ??= new LRUCache<string, Photon.PhotonImage>(30, freePhoton);
G.__renderOutputCache ??= new LRUCache<string, Uint8Array>(80);

const imageCache: Record<string, ArrayBuffer> = G.__imageCache;
const base64Cache: Record<string, string> = G.__base64Cache;
const fontCache: Record<string, ArrayBuffer> = G.__fontCache;
const photonCache: LRUCache<string, Photon.PhotonImage> = G.__photonCache;
const layerCache: LRUCache<string, Photon.PhotonImage> = G.__layerCache;
const uiPhotonCache: LRUCache<string, Photon.PhotonImage> = G.__uiPhotonCache;
const renderOutputCache: LRUCache<string, Uint8Array> = G.__renderOutputCache;

// ─── WASM init ───────────────────────────────────────────────────────────────

const WASM_URL = 'https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm';
let wasmInitPromise: Promise<void> | null = null;

async function ensureWasm(): Promise<void> {
  if (wasmInitPromise) return wasmInitPromise;
  wasmInitPromise = (async () => {
    let buf = imageCache[WASM_URL];
    if (!buf) {
      const r = await fetch(WASM_URL);
      if (!r.ok) throw new Error(`WASM fetch failed: ${r.status}`);
      buf = await r.arrayBuffer();
      imageCache[WASM_URL] = buf;
    }
    await initWasm(buf);
  })();
  return wasmInitPromise;
}

// ─── Image / Font helpers ────────────────────────────────────────────────────

const BASE_URL =
  'https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main';

export async function getImageBytes(key: string): Promise<ArrayBuffer> {
  if (imageCache[key]) return imageCache[key];
  const path: string = imageManifest[key];
  if (!path) throw new Error(`Image key not found in manifest: ${key}`);
  const r = await fetch(`${BASE_URL}/${path}`);
  if (!r.ok) throw new Error(`Failed to fetch image "${key}": ${r.status}`);
  const buf = await r.arrayBuffer();
  imageCache[key] = buf;
  return buf;
}

async function getFontBytes(url: string): Promise<ArrayBuffer> {
  if (fontCache[url]) return fontCache[url];
  const buf = await fetch(url).then(r => r.arrayBuffer());
  fontCache[url] = buf;
  return buf;
}

function getBase64Cached(key: string, buf: ArrayBuffer): string {
  if (base64Cache[key]) return base64Cache[key];
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    );
  }
  const b64 = btoa(binary);
  base64Cache[key] = b64;
  return b64;
}

// ─── Photon helpers ───────────────────────────────────────────────────────────

function toPhoton(buf: ArrayBuffer): Photon.PhotonImage {
  return Photon.PhotonImage.new_from_byteslice(new Uint8Array(buf));
}

function clonePhoton(img: Photon.PhotonImage): Photon.PhotonImage {
  return new Photon.PhotonImage(
    new Uint8Array(img.get_raw_pixels()),
    img.get_width(),
    img.get_height()
  );
}

function flipX(img: Photon.PhotonImage): Photon.PhotonImage {
  const w = img.get_width(),
    h = img.get_height();
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

async function getImage(
  key: string,
  w?: number,
  h?: number,
  flipped = false
): Promise<Photon.PhotonImage> {
  const cacheKey = `${key}_${w ?? 0}_${h ?? 0}_${flipped}`;
  const cached = photonCache.get(cacheKey);
  if (cached) return clonePhoton(cached);

  let img = toPhoton(await getImageBytes(key));

  if (flipped) {
    const f = flipX(img);
    img.free();
    img = f;
  }

  if (w && h) {
    const r = Photon.resize(img, w, h, Photon.SamplingFilter.Lanczos3);
    img.free();
    img = r;
  } else if (!w && h) {
    const ratio = img.get_width() / img.get_height();
    const r = Photon.resize(
      img,
      Math.round(h * ratio),
      h,
      Photon.SamplingFilter.Lanczos3
    );
    img.free();
    img = r;
  }

  photonCache.set(cacheKey, img);
  return clonePhoton(img);
}

async function getImageReadOnly(
  key: string,
  w?: number,
  h?: number,
  flipped = false
): Promise<Photon.PhotonImage> {
  const cacheKey = `${key}_${w ?? 0}_${h ?? 0}_${flipped}`;
  const cached = photonCache.get(cacheKey);
  if (cached) return cached;

  let img = toPhoton(await getImageBytes(key));

  if (flipped) {
    const f = flipX(img);
    img.free();
    img = f;
  }

  if (w && h) {
    const r = Photon.resize(img, w, h, Photon.SamplingFilter.Lanczos3);
    img.free();
    img = r;
  } else if (!w && h) {
    const ratio = img.get_width() / img.get_height();
    const r = Photon.resize(
      img,
      Math.round(h * ratio),
      h,
      Photon.SamplingFilter.Lanczos3
    );
    img.free();
    img = r;
  }

  photonCache.set(cacheKey, img);
  return img;
}

// ─── Background layer ─────────────────────────────────────────────────────────

async function getBackground(
  W: number,
  H: number
): Promise<Photon.PhotonImage> {
  const key = `bg_${W}_${H}`;
  const cached = layerCache.get(key);
  if (cached) return clonePhoton(cached);

  const [board, frame] = await Promise.all([
    getImage('board', W, H),
    getImageReadOnly('frameless', W, H),
  ]);
  Photon.watermark(board, frame, 0n, 0n);

  layerCache.set(key, board);
  return clonePhoton(board);
}

// ─── Characters layer ─────────────────────────────────────────────────────────

function buildCharactersKey(
  playerImages: string[][],
  playerHp: number[],
  creatureImages: string[],
  creatureHp: number
): string {
  const players = playerImages
    .map((imgs, i) => `${imgs[0]}:${playerHp[i] > 0 ? 1 : 0}`)
    .join('|');
  return `chars::${players}::${creatureImages[0]}:${creatureHp > 0 ? 1 : 0}`;
}

async function getCharactersLayer(
  playerImages: string[][],
  playerHp: number[],
  creatureImages: string[],
  creatureHp: number,
  W: number,
  H: number
): Promise<Photon.PhotonImage> {
  const key = buildCharactersKey(
    playerImages,
    playerHp,
    creatureImages,
    creatureHp
  );
  const cached = layerCache.get(key);
  if (cached) return cached;

  const layer = new Photon.PhotonImage(new Uint8Array(W * H * 4), W, H);

  const slots = [
    { i: 3, x: (W * 2) / 8 - 45, y: H / 2 - 52 * 2 - 45 },
    { i: 2, x: (W * 2) / 8 + 75, y: H / 2 - 52 * 2 - 45 },
    { i: 1, x: (W * 2) / 8 - 75, y: H / 2 - 52 * 2 + 45 },
    { i: 0, x: (W * 2) / 8 + 50, y: H / 2 - 52 * 2 + 45 },
  ];

  const activeSlots = slots.filter(s => playerHp[s.i] > 0);
  const sprites = await Promise.all(
    activeSlots.map(s =>
      getImageReadOnly(playerImages[s.i][0], undefined, 184, true).then(
        img => ({ s, img })
      )
    )
  );

  for (const { s, img } of sprites) {
    Photon.watermark(
      layer,
      img,
      BigInt(Math.round(s.x)),
      BigInt(Math.round(s.y))
    );
  }

  if (creatureHp > 0) {
    const img = await getImageReadOnly(creatureImages[0], 400, 400, true);
    Photon.watermark(layer, img, 600n, BigInt(Math.round(H / 2 - 240)));
  }

  layerCache.set(key, layer);
  return layer;
}

// ─── UI Overlay ───────────────────────────────────────────────────────────────

async function buildOverlayJsx(
  team: Team,
  creature: Creature,
  messages: string[],
  state: string | null,
  lang: string,
  W: number,
  H: number
): Promise<object> {
  const hp =
    lang === Lang.French ? HealthBarName.French : HealthBarName.English;
  const langIndex = lang === Lang.French ? 1 : 0;

  function healthBar(
    current: number,
    max: number,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const pct = Math.max(0, Math.min(1, current / max));
    return {
      type: 'div',
      props: {
        style: {
          position: 'absolute' as const,
          display: 'flex' as const,
          left: x,
          top: y,
          width: w,
          height: h,
          background: '#ff0000',
        },
        children: {
          type: 'div',
          props: {
            style: {
              width: Math.round(w * pct),
              height: h,
              background: '#00FF00',
            },
            children: null,
          },
        },
      },
    };
  }

  const creatureGender = creature.gender;
  const name = creature.name[langIndex];
  const creaturePrefix = creature.prefix
    ? lang === Lang.French
      ? creatureGender === 'female'
        ? Prefix.French_Determined_Feminine
        : Prefix.French_Determined_Masculine
      : Prefix.English_Determined
    : Prefix.None;

  const endMsg = state
    ? (
        {
          good:
            lang === Lang.French
              ? `${EndMessages.French_Good}${creaturePrefix}${name}${EndMessages.French_ExclamationMark}`
              : `${EndMessages.English_Good}${creaturePrefix}${name}${EndMessages.English_ExclamationMark}`,
          bad:
            lang === Lang.French
              ? EndMessages.French_Bad
              : EndMessages.English_Bad,
          giveup:
            lang === Lang.French
              ? EndMessages.French_Giveup
              : EndMessages.English_Giveup,
          best:
            lang === Lang.French
              ? `${EndMessages.French_Best}${creaturePrefix}${name}${EndMessages.French_ExclamationMark}`
              : `${EndMessages.English_Best}${creaturePrefix}${name}${EndMessages.English_ExclamationMark}`,
        } as Record<string, string>
      )[state]
    : null;

  const endMsg2 = state
    ? (
        {
          good:
            lang === Lang.French
              ? RetryMessages.French_Good
              : RetryMessages.English_Good,
          bad:
            lang === Lang.French
              ? RetryMessages.French_Bad
              : RetryMessages.English_Bad,
          giveup:
            lang === Lang.French
              ? RetryMessages.French_Giveup
              : RetryMessages.English_Giveup,
          best:
            lang === Lang.French
              ? RetryMessages.French_Best
              : RetryMessages.English_Best,
        } as Record<string, string>
      )[state]
    : null;

  // Résolution synchrone depuis le cache — pas d'await dans la construction JSX
  const endImgSrc =
    endMsg && imageCache['end_' + state]
      ? `data:image/png;base64,${getBase64Cached('end_' + state, imageCache['end_' + state])}`
      : null;

  let pid = 0;
  switch (team.activePlayer?.name[0]) {
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
      style: {
        display: 'flex' as const,
        position: 'relative' as const,
        width: W,
        height: H,
        fontFamily: '"Ginto Nord Black"',
        color: '#000000',
        overflow: 'hidden',
      },
      children: [
        // ── Chat messages ──────────────────────────────────────────────
        ...messages.map((msg, i) => ({
          type: 'div',
          props: {
            style: {
              display: 'flex' as const,
              position: 'absolute' as const,
              left: 104,
              top: (192 + i * 16) * 2 + 120,
              fontSize: 16,
              fontFamily: '"Ginto Nord Black"',
              color: '#000000',
            },
            children: msg,
          },
        })),

        // ── Player info (main) ─────────────────────────────────────────
        {
          type: 'img',
          props: {
            src: team.activePlayer?.icon,
            style: {
              position: 'absolute' as const,
              left: 40 * 1.5 + 10,
              top: 40 + 10 - 38,
              width: 50,
              height: 50,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex' as const,
              position: 'absolute' as const,
              left: 40 * 2 + 40,
              top: 42 * 2 - 55,
              fontSize: 16,
              fontFamily: '"Ginto Nord Black"',
            },
            children: `${team.activePlayer?.name[langIndex]} (${Math.max(team.activePlayer?.hp || 0, 0)} ${hp})`,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex' as const,
              position: 'absolute' as const,
              right: W - 210 * 2,
              top: 42 * 2 - 55,
              fontSize: 16,
              fontFamily: '"Ginto Nord Medium"',
            },
            children: `${team.activePlayer?.attack[0]}-${team.activePlayer?.attack[1]}ATK`,
          },
        },
        healthBar(
          team.activePlayer?.hp || 0,
          team.activePlayer?.hpMax || 0,
          38 * 2,
          46.25 * 2 - 38,
          173.5 * 2,
          8.5 * 2
        ),

        // ── Player info (secondary x3) ─────────────────────────────────
        ...[1, 2, 3].flatMap(offset => {
          const i = (pid + offset) % 4;
          const xBase = offset === 2 ? 332 * 2 : 234 * 2;
          const yBase = offset === 3 ? 56.25 * 2 - 38 : 36 * 2 - 38 + 3;
          const thmX = offset === 2 ? 300 * 1.5 + 10 + 200 : 300 * 1.5 + 10;
          const thmY = offset === 3 ? 70 + 10 - 38 : 40 - 38;
          const op = team.players[i];
          return [
            {
              type: 'img',
              props: {
                src: op?.icon,
                style: {
                  position: 'absolute' as const,
                  left: thmX,
                  top: thmY,
                  width: 40,
                  height: 40,
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex' as const,
                  position: 'absolute' as const,
                  left: xBase + 32,
                  top: yBase - 16,
                  fontSize: 12,
                  fontFamily: '"Ginto Nord Black"',
                },
                children: `${op?.name[langIndex]} (${Math.max(op?.hp || 0, 0)} ${hp})`,
              },
            },
            healthBar(op?.hp || 0, op?.hpMax || 0, xBase, yBase, 173, 8.5),
          ];
        }),

        // ── Creature info ──────────────────────────────────────────────
        {
          type: 'div',
          props: {
            style: {
              display: 'flex' as const,
              position: 'absolute' as const,
              left: 288 * 2,
              top: 148 * 2 + 129,
              fontSize: 12,
              fontFamily: '"Ginto Nord Black"',
            },
            children: `${creature.name[langIndex]} (${creature.hp} ${hp})`,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex' as const,
              position: 'absolute' as const,
              right: W - 460 * 2,
              top: 148 * 2 + 129,
              fontSize: 12,
              fontFamily: '"Ginto Nord Medium"',
            },
            children: `${creature.attack[0]}-${creature.attack[1]}ATK`,
          },
        },
        healthBar(
          creature.hp,
          creature.hpMax,
          286.5 * 2,
          152 * 2 + 139,
          173.5 * 2,
          8.5 * 2
        ),

        // ── End-state overlay ──────────────────────────────────────────
        ...(endMsg && endImgSrc
          ? [
              {
                type: 'img',
                props: {
                  src: endImgSrc,
                  style: {
                    position: 'absolute' as const,
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex' as const,
                    position: 'absolute' as const,
                    left: W / 2 - endMsg.length * 9,
                    right: 0,
                    top: 135 * 2 + 100,
                    textAlign: 'center' as const,
                    fontSize: 32,
                    fontFamily: '"Ginto Nord Medium"',
                    color: '#FFFFFF',
                  },
                  children: endMsg,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex' as const,
                    position: 'absolute' as const,
                    left: W / 2 - (endMsg2?.length || 0) * 9,
                    right: 0,
                    top: 135 * 2 + 100 + 50,
                    textAlign: 'center' as const,
                    fontSize: 32,
                    fontFamily: '"Ginto Nord Medium"',
                    color: '#FFFFFF',
                  },
                  children: endMsg2,
                },
              },
            ]
          : []),
      ],
    },
  };
}

function buildUiCacheKey(
  team: Team,
  creature: Creature,
  messages: string[],
  state: string | null,
  lang: string
): string {
  return [
    team.players
      .map(
        p =>
          `${p.name}:${Math.max(p.hp, 0)}/${p.hpMax}:${p.attack[0]}-${p.attack[1]}`
      )
      .join(','),
    team.activePlayer?.name ?? '',
    `${creature.name}:${creature.hp}/${creature.hpMax}:${creature.attack[0]}-${creature.attack[1]}`,
    messages.join('\x00'),
    state ?? '',
    lang,
  ].join('|');
}

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
  const cached = uiPhotonCache.get(uiCacheKey);
  if (cached) return cached;

  const overlayJsx = await buildOverlayJsx(
    team,
    creature,
    messages,
    state,
    lang,
    W,
    H
  );

  const svg = await satori(overlayJsx, {
    width: W,
    height: H,
    fonts: [
      { name: 'Sans-Serif', data: fontMediumBuf, weight: 400, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } })
    .render()
    .asPng();
  const img = toPhoton(png.buffer.slice(0) as ArrayBuffer);

  uiPhotonCache.set(uiCacheKey, img);
  return img;
}

// ─── Warmup (appeler au démarrage du Worker) ──────────────────────────────────

const END_STATES = ['good', 'bad', 'giveup', 'best'];

export async function warmup(): Promise<void> {
  await Promise.all([
    ensureWasm(),
    ...END_STATES.map(s => getImageBytes('end_' + s)),
  ]);
}

// Appeler warmup au démarrage pour précharger les ressources nécessaires
warmup().catch(err => console.error('Warmup failed:', err));

// ─── Main render ──────────────────────────────────────────────────────────────

export default async function renderImage(
  state: string | null,
  messages: string[],
  team: Team,
  creature: Creature,
  lang = 'en'
): Promise<Uint8Array> {
  await ensureWasm();

  const W = 1000,
    H = 600;

  if (creature.hp <= 0) {
    team.players[0].images = [KazumaImages.Hug];
    team.players[1].images = [DarknessImages.Hug];
    team.players[2].images = [MeguminImages.Hug];
    team.players[3].images = [AquaImages.Hug];
  }
  creature.hp = Math.max(creature.hp, 0);

  const uiCacheKey = buildUiCacheKey(team, creature, messages, state, lang);
  const playerImages = team.players.map(p => p.images);
  const teamHp = team.players.map(p => p.hp);
  const charsKey = buildCharactersKey(
    playerImages,
    teamHp,
    creature.images,
    creature.hp
  );
  const renderCacheKey = `render::${uiCacheKey}::${charsKey}`;

  const cachedOutput = renderOutputCache.get(renderCacheKey);
  if (cachedOutput) return new Uint8Array(cachedOutput);

  const [fontMediumBuf] = await Promise.all([
    getFontBytes(`${BASE_URL}/assets/swordgame/font/GintoNordMedium.otf`),
  ]);

  const [canvas, chars, uiImg] = await Promise.all([
    getBackground(W, H),
    getCharactersLayer(
      playerImages,
      teamHp,
      creature.images,
      creature.hp,
      W,
      H
    ),
    getUIOverlay(
      uiCacheKey,
      team,
      creature,
      messages,
      state,
      lang,
      fontMediumBuf,
      W,
      H
    ),
  ]);

  Photon.watermark(canvas, chars, 0n, 0n);
  Photon.watermark(canvas, uiImg, 0n, 0n);

  const output = new Uint8Array(canvas.get_bytes_webp());
  canvas.free();

  renderOutputCache.set(renderCacheKey, new Uint8Array(output));
  return output;
}

// ─── Cache diagnostics ────────────────────────────────────────────────────────

export function getCacheDiagnostics(): Record<string, unknown> {
  return {
    photonCacheSize: photonCache.size,
    layerCacheSize: layerCache.size,
    uiCacheSize: uiPhotonCache.size,
    renderOutputCacheSize: renderOutputCache.size,
    imageCacheKeys: Object.keys(imageCache).length,
    base64CacheKeys: Object.keys(base64Cache).length,
    fontCacheKeys: Object.keys(fontCache).length,
  };
}

export { renderOutputCache };

export interface PerfSpan {
  label: string;
  ms: number;
}

export interface PerfReport {
  totalMs: number;
  spans: PerfSpan[];
  cacheHits: Record<string, boolean>;
}

const _perfReport: PerfReport | null = null;

export function getLastPerfReport(): PerfReport | null {
  return _perfReport;
}
