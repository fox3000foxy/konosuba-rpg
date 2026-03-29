import { Context } from 'hono';
import { Lang } from '../objects/enums/Lang';
import { calculateGameImageFromUrl } from '../services/gameService';

export async function calculateRPG(c: Context) {
  const { lang } = c.req.param() as { lang: Lang };
  const { image } = await calculateGameImageFromUrl(c.req.url, lang);

  if (!image) {
    return c.text('Image generation failed', 500);
  }

  c.header('Content-Type', 'image/webp');
  const responseBody =
    image instanceof Uint8Array
      ? image.buffer.slice(
          image.byteOffset,
          image.byteOffset + image.byteLength
        )
      : image;

  return new Response(responseBody as ArrayBuffer, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control':
        'public, max-age=0, s-maxage=15, stale-while-revalidate=60',
      'CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
      'Vercel-CDN-Cache-Control':
        'public, s-maxage=15, stale-while-revalidate=60',
    },
  });
}
