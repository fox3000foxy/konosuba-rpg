import * as Photon from '@cf-wasm/photon';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import satori from 'satori';
import { imageManifest } from '../data/imageManifest';

// ─── WASM init (once per Worker lifetime) ────────────────────────────────────

let wasmReady = false;
async function ensureWasm(): Promise<void> {
  if (wasmReady) return;

  // if (navigator.userAgent !== 'Cloudflare-Workers') {
    await initWasm(await fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm').then((r) => r.arrayBuffer()));
    console.log('WASM initialized (dev)');
    wasmReady = true;
    return;
  // }
  // else {
  //   console.log('Running in Cloudflare Workers environment, using global WebAssembly.instantiate for resvg WASM module');
  //   // @ts-ignore
  //   const resvgWasm = await import('@resvg/resvg-wasm/index_bg.wasm?module').then((m) => m.default);
  //   await initWasm(resvgWasm);
  //   console.log('WASM initialized (prod)');
  //   wasmReady = true;
  //   return;
  // }
}

ensureWasm().then(() => {
}).catch((err) => {
  console.error('Failed to initialize WASM:', err);
});

// ─── Image cache (ArrayBuffer, not canvas Image objects) ─────────────────────

const imageCache: Record<string, ArrayBuffer> = {};

export async function getImageBytes(key: string): Promise<ArrayBuffer> {
  if (imageCache[key]) return imageCache[key];

  // imageManifest[key] should be a URL string or a dynamic import that resolves to one
  // const url: string = typeof imageManifest[key] === 'string'
  //   ? imageManifest[key]
  //   : await import(imageManifest[key]).then((m) => m.default ?? m);

  const url: string = imageManifest[key];

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image "${key}": ${resp.status}`);
  const buf = await resp.arrayBuffer();
  imageCache[key] = buf;
  return buf;
}

async function toPhoton(buf: ArrayBuffer): Promise<Photon.PhotonImage> {
  const bytes = new Uint8Array(buf);
  try {
    return Photon.PhotonImage.new_from_byteslice(bytes);
  } catch (err) {
    console.warn('Photon cannot decode bytes directly, trying fallback decoder:', err);
  }

  // Fallback path for formats not supported by Photon (AVIF, etc.)
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

  // Node.js fallback using sharp if available
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Flip an image horizontally (mirror on X axis) */
function flipX(img: Photon.PhotonImage): Photon.PhotonImage {
  const w = img.get_width();
  const h = img.get_height();
  const raw = img.get_raw_pixels(); // Uint8Array of RGBA
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
 * Draw `src` onto `canvas` at (x, y), scaled to (w, h).
 * Photon's watermark() requires same-size images, so we resize src first.
 */
function composite(
  canvas: Photon.PhotonImage,
  src: Photon.PhotonImage,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const resized = Photon.resize(src, w, h, Photon.SamplingFilter.Lanczos3);
  Photon.watermark(canvas, resized, BigInt(Math.round(x)), BigInt(Math.round(y)));
  resized.free();
}

// ─── Main render ─────────────────────────────────────────────────────────────

export default async function renderImage(
  state: string | null,
  messages: string[],
  player: any,
  creature: any,
  lang = 'en'
): Promise<Uint8Array> {
  await ensureWasm();

  const W = 1000;
  const H = 600;

  // ── 1. Load board and create base canvas ──────────────────────────────────
  const boardImg = await toPhoton(await getImageBytes('board'));
  const canvas = Photon.resize(boardImg, W, H, Photon.SamplingFilter.Lanczos3);
  boardImg.free();

  const boardImg2 = await toPhoton(await getImageBytes('frameless'));
  composite(canvas, boardImg2, 0, 0, W, H);
  boardImg2.free();

  // ── 2. Composite character sprites (mirrored side = right side) ───────────
  //
  // Original code did ctx.transform(-1,0,0,1,W,0) before drawing characters,
  // which mirrors the entire coordinate system. We replicate this by:
  //   a) flipping each character image horizontally
  //   b) computing the mirrored X position manually: mirroredX = W - x - imgW

  if (creature.hp <= 0) {
    player.images = [
      ['character_kazuma04'],
      ['character_daku04'],
      ['character_meg04'],
      ['character_aqua04'],
    ];
  }

  creature.hp = Math.max(creature.hp, 0);

  // Character draw positions (converted for no global transform, player side is right)
  // We flip each sprite manually and use absolute target X (same visual expected as the old mirrored transform layout).
  const charSlots = [
    { index: 3, x: (W * 2) / 8 - 45, y: (H / 2 - 52 * 2) - 45 },
    { index: 2, x: (W * 2) / 8 + 75, y: (H / 2 - 52 * 2) - 45 },
    { index: 1, x: (W * 2) / 8 - 75, y: (H / 2 - 52 * 2) + 45 },
    { index: 0, x: (W * 2) / 8 + 50, y: (H / 2 - 52 * 2) + 45 },
  ];

  for (const slot of charSlots) {
    const i = slot.index;
    if (player.hp[i] <= 0) continue;
    const key = player.images[i][0];
    const srcImg = await toPhoton(await getImageBytes(key));
    const srcW = srcImg.get_width();
    const srcH = srcImg.get_height();
    const drawH = 184;
    const drawW = Math.round(drawH * srcW / srcH);

    const flipped = flipX(srcImg);
    const targetX = slot.x - drawW;
    const actualX = Math.max(0, Math.min(W - drawW, targetX));
    composite(canvas, flipped, actualX, slot.y, drawW, drawH);
    flipped.free();
  }

  // Creature (also on mirrored side in original, but drawn at left)
  if (creature.hp > 0) {
    const creatureImg = await toPhoton(await getImageBytes(creature.images[0]));
    const flipped = flipX(creatureImg);
    composite(canvas, flipped, ((W * 1) / 8 - 140) + W / 2 + 55, H / 2 - 240, 400, 400);
    flipped.free();
  }

  // ── 4. Text + UI overlay via Satori → resvg → composite ──────────────────
  //
  // Load fonts (fetch from your assets/R2/KV)
  const [fontBlackBuf, fontMediumBuf] = await Promise.all([
    fetch('https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/swordgame/font/GintoNordBlack.otf').then((r) => r.arrayBuffer()),
    fetch('https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/swordgame/font/GintoNordMedium.otf').then((r) => r.arrayBuffer()),
  ]);

  const hp = (lang === 'fr') ? 'PV' : 'HP';
  const pid = player.currentPlayerId;

  // Thumbnail keys
  const thmbs = [
    'thmb_in_1001100', 'thmb_in_1031100', 'thmb_in_1021100', 'thmb_in_1011100',
  ];

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack overflow
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  // Pre-fetch thumbs as base64 data URIs for inline SVG <image> tags
  async function toDataURI(key: string): Promise<string> {
    const buf = await getImageBytes(key);
    const b64 = arrayBufferToBase64(buf);
    return `data:image/png;base64,${b64}`;
  }

  const thmb = await Promise.all(thmbs.map((_, i) => toDataURI(thmbs[(pid + i) % 4])));

  // Health bar helper (returns JSX-like object)
  function healthBar(
    current: number, max: number,
    x: number, y: number,
    w: number, h: number
  ) {
    const pct = Math.max(0, Math.min(1, current / max));
    return {
      type: 'div',
      props: {
        style: {
          position: 'absolute' as const,
          display: 'flex' as const,
          left: x, top: y, width: w, height: h,
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

  // End-state text
  const endMsg = state ? ({
    good: lang === 'fr' ? `Vous avez réussi à vaincre ${creature.prefix ? "le " : ""}${creature.name} !` : `You won from ${creature.prefix ? "the " : ""}${creature.name}!`,
    bad: lang === 'fr' ? "L'adversaire vous a vaincu..." : "The adversary has defeated you...",
    giveup: lang === 'fr' ? "Vous avez déclaré forfait." : "You have withdrawn.",
    best: lang === 'fr' ? `Vous avez réussi à être ami avec ${creature.prefix ? "le " : ""}${creature.name} !` : `You managed to be friends with ${creature.prefix ? "the " : ""}${creature.name}!`,
  } as Record<string, string>)[state] : null;

  const endMsg2 = state ? ({
    good: lang === 'fr' ? "Arriverez vous a faire mieux ?" : "Will you get it better?",
    bad: lang === 'fr' ? "Rententez votre chance." : "Retry.",
    giveup: lang === 'fr' ? "Peut être une prochaine fois ?" : "Maybe next time?",
    best: lang === 'fr' ? "Pourrez vous être ami avec d'autres créatures ?" : "Can you be friends with other creatures?",
  } as Record<string, string>)[state] : null;

  // ── 3. End-state overlay (win/lose/giveup/best) ───────────────────────────
  // if (state) {
  //   const endImg = toPhoton(await getImageBytes('end_' + state));
  //   composite(canvas, endImg, 0, 0, W, H);
  //   endImg.free();
  // }


  const overlayJsx = {
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
              fontSize: 20,
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
            src: thmb[0],
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
            children: `${player.name[pid]} (${Math.max(player.hp[pid], 0)} ${hp})`,
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
            children: `${player.attack[pid][0]}-${player.attack[pid][1]}ATK`,
          },
        },
        healthBar(player.hp[pid], player.hpMax[pid], 38 * 2, 46.25 * 2 - 38, 173.5 * 2, 8.5 * 2),

        // ── Player info (secondary x3) ─────────────────────────────────
        ...[1, 2, 3].flatMap((offset) => {
          const i = (pid + offset) % 4;
          const xBase = offset === 2 ? 332 * 2 : 234 * 2;
          const yBase = offset === 3 ? 56.25 * 2 - 38 : 36 * 2 - 38 + 3;
          const thmX = offset === 2 ? 300 * 1.5 + 10 + 200 : 300 * 1.5 + 10;
          const thmY = offset === 3 ? 70 + 10 - 38 : 40 - 38;

          return [
            {
              type: 'img',
              props: {
                src: thmb[offset],
                style: { position: 'absolute' as const, left: thmX, top: thmY, width: 40, height: 40 },
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
                children: `${player.name[i]} (${Math.max(player.hp[i], 0)} ${hp})`,
              },
            },
            healthBar(player.hp[i], player.hpMax[i], xBase, yBase, 173, 8.5),
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
            children: `${creature.name} (${creature.hp} ${hp})`,
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
        healthBar(creature.hp, creature.hpMax, 286.5 * 2, 152 * 2 + 139, 173.5 * 2, 8.5 * 2),

        // ── End-state text ─────────────────────────────────────────────
        ...(endMsg ? [
          {
            type: 'img',
            props: {
              src: `data:image/png;base64,${arrayBufferToBase64(await getImageBytes('end_' + state))}`,
              style: {
                position: 'absolute' as const,
                left: 0, // rough centering based on expected image size
                top: 0,
                width: "100%",
                height: "100%"
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex' as const,
                position: 'absolute' as const,
                left: W / 2 - endMsg.length * 9, // rough centering based on char count
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
                left: W / 2 - (endMsg2?.length || 0) * 9, // rough centering based on char count
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
        ] : []),
      ],
    },
  };

  const overlaySvg = await satori(overlayJsx, {
    width: W,
    height: H,
    fonts: [
      { name: 'Sans-Serif', data: fontMediumBuf, weight: 400, style: 'normal' },

    ],
  });

  // Rasterize SVG overlay to PNG
  const resvg = new Resvg(overlaySvg, { fitTo: { mode: 'width', value: W } });
  const overlayPng = resvg.render().asPng();

  // Composite text overlay onto photon canvas (full-size, transparent bg)
  const overlayImgPhoton = await toPhoton(overlayPng.buffer.slice(0) as ArrayBuffer);
  Photon.watermark(canvas, overlayImgPhoton, 0n, 0n);
  overlayImgPhoton.free();

  // ── 5. Export ─────────────────────────────────────────────────────────────
  const output = canvas.get_bytes_webp(); // or .get_bytes() for PNG (larger)
  canvas.free();
  return output;
}