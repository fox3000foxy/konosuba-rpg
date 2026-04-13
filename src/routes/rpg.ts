import { type Context } from "hono";
import { type Lang } from "../objects/enums/Lang";
import { calculateGameImageFromUrl } from "../services/gameRenderService";
import { imageCacheHeaders } from "../utils/cacheHeaders";

export async function calculateRPG(c: Context) {
  const { lang } = c.req.param() as { lang: Lang };
  const userId = c.req.query("userId");
  const { image } = await calculateGameImageFromUrl(c.req.url, lang, userId);

  if (!image) {
    return c.text("Image generation failed", 500);
  }

  c.header("Content-Type", "image/webp");
  const responseBody = image instanceof Uint8Array ? image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength) : image;

  return new Response(responseBody as ArrayBuffer, {
    headers: imageCacheHeaders("image/webp"),
  });
}
