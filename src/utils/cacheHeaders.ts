export const CACHE_CONTROL_IMAGE = "public, max-age=0, s-maxage=15, stale-while-revalidate=60";
export const CDN_CACHE_CONTROL = "public, s-maxage=15, stale-while-revalidate=60";

export function imageCacheHeaders(contentType: string) {
  return {
    "Content-Type": contentType,
    "Cache-Control": CACHE_CONTROL_IMAGE,
    "CDN-Cache-Control": CDN_CACHE_CONTROL,
    "Vercel-CDN-Cache-Control": CDN_CACHE_CONTROL,
  };
}
