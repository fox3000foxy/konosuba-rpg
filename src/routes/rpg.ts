import { Context } from 'hono';
import { Lang } from '../objects/enums/Lang';
import { calculateGameImageFromUrl } from '../services/gameService';
import { imageCacheHeaders } from '../utils/cacheHeaders';

type RpgRouteGlobals = {
  __rpgInFlight?: number;
  __rpgRateWindow?: Map<string, { startedAt: number; count: number }>;
};

const G = globalThis as unknown as RpgRouteGlobals;
G.__rpgInFlight ??= 0;
G.__rpgRateWindow ??= new Map<string, { startedAt: number; count: number }>();
const rateWindow = G.__rpgRateWindow!;

const MAX_IN_FLIGHT_RENDERS = 12;
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_PER_WINDOW = 6;

function resolveRateKey(c: Context, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = c.req.header('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim();
  return ip ? `ip:${ip}` : 'anon';
}

export async function calculateRPG(c: Context) {
  const { lang } = c.req.param() as { lang: Lang };
  const userId = c.req.query('userId');
  const inFlight = G.__rpgInFlight ?? 0;

  if (inFlight >= MAX_IN_FLIGHT_RENDERS) {
    c.header('Retry-After', '1');
    return c.text('Render queue is full, please retry shortly.', 503);
  }

  const now = Date.now();
  const rateKey = resolveRateKey(c, userId);
  const bucket = rateWindow.get(rateKey);
  if (!bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateWindow.set(rateKey, { startedAt: now, count: 1 });
  } else if (bucket.count >= RATE_LIMIT_PER_WINDOW) {
    c.header('Retry-After', '1');
    return c.text('Too many render requests, slow down.', 429);
  } else {
    bucket.count += 1;
  }

  G.__rpgInFlight = inFlight + 1;
  let image: Uint8Array | ArrayBuffer | null;
  try {
    const result = await calculateGameImageFromUrl(c.req.url, lang, userId);
    image = result.image ?? null;
  } finally {
    const current = G.__rpgInFlight ?? 1;
    G.__rpgInFlight = Math.max(0, current - 1);
  }

  if (!image) {
    return c.text('Image generation failed', 500);
  }

  c.header('Content-Type', 'image/webp');
  const responseBody = image instanceof Uint8Array ? image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength) : image;

  return new Response(responseBody as ArrayBuffer, {
    headers: imageCacheHeaders('image/webp'),
  });
}
