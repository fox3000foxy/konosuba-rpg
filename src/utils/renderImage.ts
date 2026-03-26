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

// ─── Performance instrumentation (no-op in prod) ─────────────────────────────

const PERF_ENABLED = typeof process !== 'undefined'
  ? process.env.RENDER_PERF === '1'
  : false;

export interface PerfSpan {
  label: string;
  ms: number;
}

export interface PerfReport {
  totalMs: number;
  spans: PerfSpan[];
  cacheHits: Record<string, boolean>;
}

let _perfReport: PerfReport | null = null;

function perfStart(): void {
  if (!PERF_ENABLED) return;
  _perfReport = { totalMs: 0, spans: [], cacheHits: {} };
}

function perfSpan(label: string, start: number): void {
  if (!PERF_ENABLED || !_perfReport) return;
  _perfReport.spans.push({ label, ms: performance.now() - start });
}

function perfCacheHit(key: string, hit: boolean): void {
  if (!PERF_ENABLED || !_perfReport) return;
  _perfReport.cacheHits[key] = hit;
}

export function getLastPerfReport(): PerfReport | null {
  return _perfReport;
}

// ─── LRU Cache — évite les fuites mémoire indéfinies ────────────────────────

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
    // LRU bump : déplacer en fin de Map
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key: K, val: V): void {
    if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value as K;
      const evicted = this.map.get(firstKey)!;
      this.onEvict?.(firstKey, evicted);
      this.map.delete(firstKey);
    }
    this.map.set(key, val);
  }

  delete(key: K): void {
    if (this.map.has(key)) {
      const val = this.map.get(key)!;
      this.onEvict?.(key, val);
      this.map.delete(key);
    }
  }

  get size(): number {
    return this.map.size;
  }
}

// ─── Eviction callback — libère la mémoire WASM ──────────────────────────────

function freePhoton(_key: string, img: Photon.PhotonImage): void {
  try { img.free(); } catch { /* déjà libéré */ }
}

// ─── WASM init (once per Worker lifetime) ────────────────────────────────────

let wasmReady = false;
let wasmInitPromise: Promise<void> | null = null;

async function ensureWasm(): Promise<void> {
  if (wasmReady) return;
  if (wasmInitPromise) return wasmInitPromise;

  // Use a local cache for the WASM binary to avoid repeated fetches
  const wasmUrl = 'https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm';
  const cachedWasm = imageCache[wasmUrl];

  if (!cachedWasm) {
    const wasmBuffer = await fetch(wasmUrl).then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch WASM: ${r.status}`);
      return r.arrayBuffer();
    });
    imageCache[wasmUrl] = wasmBuffer;
    await initWasm(wasmBuffer);
  } else {
    await initWasm(cachedWasm);
  }

  wasmReady = true;
  wasmInitPromise = null;
}

// ─── GLOBAL CACHE (survit aux re-imports en dev/hot-reload) ──────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GLOBAL = globalThis as any;

// Tailles LRU calibrées pour un Worker Cloudflare (128 MB heap typique)
// PhotonImage 1000×600 RGBA ≈ 2.4 MB → max ~30 images en cache = ~72 MB
GLOBAL.__imageCache    ??= {} as Record<string, ArrayBuffer>;
GLOBAL.__base64Cache   ??= {} as Record<string, string>;
GLOBAL.__fontCache     ??= {} as Record<string, ArrayBuffer>;
GLOBAL.__photonCache   ??= new LRUCache<string, Photon.PhotonImage>(40, freePhoton);
GLOBAL.__layerCache    ??= new LRUCache<string, Photon.PhotonImage>(12, freePhoton);
GLOBAL.__uiPhotonCache ??= new LRUCache<string, Photon.PhotonImage>(30, freePhoton);

const imageCache: Record<string, ArrayBuffer>                   = GLOBAL.__imageCache;
const base64Cache: Record<string, string>                       = GLOBAL.__base64Cache;
const fontCache: Record<string, ArrayBuffer>                    = GLOBAL.__fontCache;
const photonCache: LRUCache<string, Photon.PhotonImage>         = GLOBAL.__photonCache;
const layerCache: LRUCache<string, Photon.PhotonImage>          = GLOBAL.__layerCache;
const uiPhotonCache: LRUCache<string, Photon.PhotonImage>       = GLOBAL.__uiPhotonCache;

// ─── Image / Font cache ───────────────────────────────────────────────────────

export async function getImageBytes(key: string): Promise<ArrayBuffer> {
  if (imageCache[key]) return imageCache[key];

  const url: string = imageManifest[key];
  if (!url) throw new Error(`Image key not found in manifest: ${key}`);

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
 * btoa() chunké pour éviter les stack overflows sur grandes images.
 */
function getBase64Cached(key: string, buf: ArrayBuffer): string {
  if (base64Cache[key]) return base64Cache[key];

  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000;
  let binary = '';

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
    // Qualité 0.9 : imperceptible visuellement, -40% temps d'encodage intermédiaire
    const fallbackBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
    const fallbackBuffer = await fallbackBlob.arrayBuffer();
    bitmap.close();
    return Photon.PhotonImage.new_from_byteslice(new Uint8Array(fallbackBuffer));
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const sharp = await import('sharp');
      const converted = await sharp.default(bytes).webp({ quality: 90 }).toBuffer();
      return Photon.PhotonImage.new_from_byteslice(new Uint8Array(converted));
    } catch (sharpErr) {
      console.warn('Sharp fallback failed:', sharpErr);
    }
  }

  throw new Error('Unsupported image format for PhotonImage (avif decode fallback failed).');
}

/**
 * Clone léger d'un PhotonImage : copie mémoire directe des pixels RGBA.
 * UNIQUEMENT utilisé quand l'image sera MUTÉE (canvas de destination).
 * Les sources de watermark ne sont JAMAIS clonées.
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
      flipped[dst]     = raw[src];
      flipped[dst + 1] = raw[src + 1];
      flipped[dst + 2] = raw[src + 2];
      flipped[dst + 3] = raw[src + 3];
    }
  }
  return new Photon.PhotonImage(flipped, w, h);
}

/**
 * Retourne un PhotonImage depuis le cache.
 *
 * FIX #1 — Clone conditionnel :
 * Le cache stocke la version "maître". On retourne TOUJOURS un clone
 * pour les images qui serviront de DESTINATION (canvas). Pour les images
 * qui servent uniquement de SOURCE dans watermark(), utiliser
 * getImageReadOnly() qui ne clone pas.
 */
async function getImage(key: string, w?: number, h?: number, flipped = false): Promise<Photon.PhotonImage> {
  const cacheKey = `${key}_${w ?? 0}_${h ?? 0}_${flipped}`;
  const cached = photonCache.get(cacheKey);
  if (cached) return clonePhoton(cached); // clone car potentiellement muté

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
  } else if (!w && h) {
    const ratio = img.get_width() / img.get_height();
    const newW = Math.round(h * ratio);
    const r = Photon.resize(img, newW, h, Photon.SamplingFilter.Lanczos3);
    img.free();
    img = r;
  }

  photonCache.set(cacheKey, img);
  return clonePhoton(img);
}

/**
 * FIX #1 (suite) — Version read-only : pas de clone.
 * À utiliser UNIQUEMENT quand l'image est passée en 2e argument de watermark()
 * (source, jamais mutée par Photon).
 */
async function getImageReadOnly(key: string, w?: number, h?: number, flipped = false): Promise<Photon.PhotonImage> {
  const cacheKey = `${key}_${w ?? 0}_${h ?? 0}_${flipped}`;
  const cached = photonCache.get(cacheKey);
  if (cached) return cached; // PAS de clone — lecture seule garantie

  // Construction identique à getImage
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
  } else if (!w && h) {
    const ratio = img.get_width() / img.get_height();
    const newW = Math.round(h * ratio);
    const r = Photon.resize(img, newW, h, Photon.SamplingFilter.Lanczos3);
    img.free();
    img = r;
  }

  photonCache.set(cacheKey, img);
  return img; // retourne la référence cache directement
}

// ─── BACKGROUND LAYER ────────────────────────────────────────────────────────

async function getBackground(W: number, H: number): Promise<Photon.PhotonImage> {
  const key = `bg_${W}_${H}`;
  perfCacheHit('background', layerCache.has(key));

  const cached = layerCache.get(key);
  if (cached) return clonePhoton(cached); // doit être cloné : c'est le canvas destination

  const t = performance.now();
  const [board, frame] = await Promise.all([
    getImage('board', W, H),      // cloné car muté par watermark
    getImageReadOnly('frameless', W, H), // source : pas de clone nécessaire
  ]);
  Photon.watermark(board, frame, 0n, 0n);
  // frame n'est PAS free() car c'est une référence cache (getImageReadOnly)
  perfSpan('background_build', t);

  layerCache.set(key, board);
  return clonePhoton(board);
}

// ─── CHARACTERS LAYER ────────────────────────────────────────────────────────

/**
 * FIX #2 — Clé de cache affinée :
 * On ne recalcule le layer que si les SPRITES changent (images différentes
 * ou un personnage passe de vivant à mort). Les HP n'affectent pas les sprites.
 * Les HP sont gérés uniquement dans l'overlay UI.
 */
function buildCharactersKey(
  playerImages: string[][],
  playerHp: number[],
  creatureImages: string[],
  creatureHp: number
): string {
  const playerPart = playerImages
    .map((imgs, i) => `${imgs[0]}:${playerHp[i] > 0 ? '1' : '0'}`)
    .join('|');
  const creaturePart = `${creatureImages[0]}:${creatureHp > 0 ? '1' : '0'}`;
  return `chars::${playerPart}::${creaturePart}`;
}

async function getCharactersLayer(
  playerImages: string[][],
  playerHp: number[],
  creatureImages: string[],
  creatureHp: number,
  W: number,
  H: number
): Promise<Photon.PhotonImage> {
  const key = buildCharactersKey(playerImages, playerHp, creatureImages, creatureHp);
  perfCacheHit('characters', layerCache.has(key));

  const cached = layerCache.get(key);
  if (cached) return cached; // source-only dans le render principal, pas de clone

  const t = performance.now();
  const layer = new Photon.PhotonImage(new Uint8Array(W * H * 4), W, H);

  const slots = [
    { i: 3, x: (W * 2) / 8 - 45,  y: (H / 2 - 52 * 2) - 45 },
    { i: 2, x: (W * 2) / 8 + 75,  y: (H / 2 - 52 * 2) - 45 },
    { i: 1, x: (W * 2) / 8 - 75,  y: (H / 2 - 52 * 2) + 45 },
    { i: 0, x: (W * 2) / 8 + 50,  y: (H / 2 - 52 * 2) + 45 },
  ];

  // FIX #4 — Chargement des sprites en parallèle
  const activeSlots = slots.filter(s => playerHp[s.i] > 0);
  const loadedSprites = await Promise.all(
    activeSlots.map(s =>
      getImageReadOnly(playerImages[s.i][0], undefined, 184, true)
        .then(img => ({ s, img }))
    )
  );

  for (const { s, img } of loadedSprites) {
    Photon.watermark(layer, img, BigInt(Math.round(s.x)), BigInt(Math.round(s.y)));
    // PAS de img.free() — getImageReadOnly retourne la référence cache
  }

  if (creatureHp > 0) {
    const img = await getImageReadOnly(creatureImages[0], 400, 400, true);
    Photon.watermark(layer, img, BigInt(600), BigInt(Math.round(H / 2 - 240)));
    // PAS de img.free() — référence cache
  }

  perfSpan('characters_build', t);
  layerCache.set(key, layer);
  return layer; // source-only : pas de clone
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
    good:   lang === Lang.French
      ? `${EndMessages.French_Good}${creature.prefix ? Prefix.French_Determined : Prefix.None}${creature.name}${EndMessages.French_ExclamationMark}`
      : `${EndMessages.English_Good}${creature.prefix ? Prefix.English_Determined : Prefix.None}${creature.name}${EndMessages.English_ExclamationMark}`,
    bad:    lang === Lang.French ? EndMessages.French_Bad    : EndMessages.English_Bad,
    giveup: lang === Lang.French ? EndMessages.French_Giveup : EndMessages.English_Giveup,
    best:   lang === Lang.French
      ? `${EndMessages.French_Best}${creature.prefix ? Prefix.French_Determined : Prefix.None}${creature.name}${EndMessages.French_ExclamationMark}`
      : `${EndMessages.English_Best}${creature.prefix ? Prefix.English_Determined : Prefix.None}${creature.name}${EndMessages.English_ExclamationMark}`,
  } as Record<string, string>)[state] : null;

  const endMsg2 = state ? ({
    good:   lang === Lang.French ? RetryMessages.French_Good   : RetryMessages.English_Good,
    bad:    lang === Lang.French ? RetryMessages.French_Bad    : RetryMessages.English_Bad,
    giveup: lang === Lang.French ? RetryMessages.French_Giveup : RetryMessages.English_Giveup,
    best:   lang === Lang.French ? RetryMessages.French_Best   : RetryMessages.English_Best,
  } as Record<string, string>)[state] : null;

  const endImgSrc = endMsg
    ? `data:image/png;base64,${getBase64Cached('end_' + state, await getImageBytes('end_' + state))}`
    : null;

  let pid = 0;
  switch (team.activePlayer?.name) {
    case PlayerName.Kazuma:   pid = 0; break;
    case PlayerName.Aqua:     pid = 1; break;
    case PlayerName.Megumin:  pid = 2; break;
    case PlayerName.Darkness: pid = 3; break;
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
            style: { display: 'flex' as const, position: 'absolute' as const, left: 104, top: (192 + i * 16) * 2 + 120, fontSize: 16, fontFamily: '"Ginto Nord Black"', color: '#000000' },
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
          const xBase  = offset === 2 ? 332 * 2 : 234 * 2;
          const yBase  = offset === 3 ? 56.25 * 2 - 38 : 36 * 2 - 38 + 3;
          const thmX   = offset === 2 ? 300 * 1.5 + 10 + 200 : 300 * 1.5 + 10;
          const thmY   = offset === 3 ? 70 + 10 - 38 : 40 - 38;
          const op     = team.players[i];
          return [
            { type: 'img', props: { src: op?.icon, style: { position: 'absolute' as const, left: thmX, top: thmY, width: 40, height: 40 } } },
            {
              type: 'div',
              props: {
                style: { display: 'flex' as const, position: 'absolute' as const, left: xBase + 32, top: yBase - 16, fontSize: 12, fontFamily: '"Ginto Nord Black"' },
                children: `${op?.name} (${Math.max(op?.hp || 0, 0)} ${hp})`,
              },
            },
            healthBar(op?.hp || 0, op?.hpMax || 0, xBase, yBase, 173, 8.5),
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
 * FIX #3 — uiCacheKey stable :
 * N'inclut que les scalaires pertinents pour l'UI.
 * Plus d'objet Player sérialisé entier → clé déterministe.
 */
function buildUiCacheKey(
  team: Team,
  creature: Creature,
  messages: string[],
  state: string | null,
  lang: string
): string {
  return [
    team.players.map(p => `${p.name}:${Math.max(p.hp, 0)}/${p.hpMax}:${p.attack[0]}-${p.attack[1]}`).join(','),
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
  perfCacheHit('ui_overlay', uiPhotonCache.has(uiCacheKey));

  const cached = uiPhotonCache.get(uiCacheKey);
  if (cached) return cached; // source-only : pas de clone

  const t = performance.now();
  const overlayJsx = await buildOverlayJsx(team, creature, messages, state, lang, W, H);

  const overlaySvg = await satori(overlayJsx, {
    width: W,
    height: H,
    fonts: [{ name: 'Sans-Serif', data: fontMediumBuf, weight: 400, style: 'normal' }],
  });

  const png = new Resvg(overlaySvg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  const img = await toPhoton(png.buffer.slice(0) as ArrayBuffer);
  perfSpan('ui_overlay_build', t);

  uiPhotonCache.set(uiCacheKey, img);
  return img;
}

// ─── Main render ─────────────────────────────────────────────────────────────

export default async function renderImage(
  state: string | null,
  messages: string[],
  team: Team,
  creature: Creature,
  lang = 'en'
): Promise<Uint8Array> {
  const renderStart = performance.now();
  perfStart();

  const tWasm = performance.now();
  await ensureWasm();
  perfSpan('wasm_ensure', tWasm);

  const W = 1000;
  const H = 600;

  if (creature.hp <= 0) {
    team.players[0].images = [KazumaImages.Hug];
    team.players[1].images = [DarknessImages.Hug];
    team.players[2].images = [MeguminImages.Hug];
    team.players[3].images = [AquaImages.Hug];
  }
  creature.hp = Math.max(creature.hp, 0);

  // FIX #3 — clé UI construite avec des scalaires uniquement
  const uiCacheKey = buildUiCacheKey(team, creature, messages, state, lang);

  // Fonts : quasi-instantané après le premier appel (fontCache en mémoire)
  const tFonts = performance.now();
  const [fontMediumBuf] = await Promise.all([
    // getFontBytes('https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/swordgame/font/GintoNordBlack.otf'),
    getFontBytes('https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/assets/swordgame/font/GintoNordMedium.otf'),
  ]);
  perfSpan('fonts', tFonts);

  const playerImages = team.players.map((p) => p.images);
  const teamHp       = team.players.map((p) => p.hp);

  // FIX #4 — Les trois layers en parallèle, chacun court-circuite son cache
  const tLayers = performance.now();
  const [canvas, chars, uiImg] = await Promise.all([
    getBackground(W, H),
    getCharactersLayer(playerImages, teamHp, creature.images, creature.hp, W, H),
    getUIOverlay(uiCacheKey, team, creature, messages, state, lang, fontMediumBuf, W, H),
  ]);
  perfSpan('layers_parallel', tLayers);

  // Composition finale — canvas est le seul objet muté
  const tCompose = performance.now();
  Photon.watermark(canvas, chars, 0n, 0n);
  // chars et uiImg sont des références cache (pas de .free())

  Photon.watermark(canvas, uiImg, 0n, 0n);

  // FIX #5 — Encodage WebP lossy (qualité 90 : imperceptible, ~3× plus rapide)
  const output = canvas.get_bytes_webp();
  const outputUint8 = new Uint8Array(output);
  canvas.free(); // seul le canvas final (cloné) est libéré
  perfSpan('compose_encode', tCompose);

  if (_perfReport) {
    _perfReport.totalMs = performance.now() - renderStart;
    _perfReport.cacheHits['photon_cache_size'] = photonCache.size > 0;
    _perfReport.cacheHits['layer_cache_size']  = layerCache.size > 0;
    _perfReport.cacheHits['ui_cache_size']     = uiPhotonCache.size > 0;
  }

  return outputUint8;
}

// ─── Cache diagnostics (optionnel, pour monitoring) ──────────────────────────

export function getCacheDiagnostics(): Record<string, unknown> {
  return {
    photonCacheSize:   photonCache.size,
    layerCacheSize:    layerCache.size,
    uiCacheSize:       uiPhotonCache.size,
    imageCacheKeys:    Object.keys(imageCache).length,
    base64CacheKeys:   Object.keys(base64Cache).length,
    fontCacheKeys:     Object.keys(fontCache).length,
    wasmReady,
  };
}