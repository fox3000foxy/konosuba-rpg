import fs from "node:fs/promises";
import path from "node:path";

const assetByteCache = new Map<string, ArrayBuffer>();
const fontBufferCache = new Map<string, Uint8Array>();

/**
 * Load asset bytes with filesystem priority (Vercel Node runtime).
 * Assets are guaranteed to be deployed with the code.
 * Falls back to fetch for development or if file not found.
 */
export async function getAssetBytes(assetPath: string, assetBaseUrl: string): Promise<ArrayBuffer | null> {
  const cacheKey = `${assetBaseUrl}${assetPath}`;

  if (assetByteCache.has(cacheKey)) {
    const cachedValue = assetByteCache.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
  }

  // Try filesystem paths in order
  const cleanPath = assetPath.replace(/^\/assets\//, "");
  const possiblePaths = [
    `/var/task/assets/${cleanPath}`, // Vercel serverless
    path.join(process.cwd(), "assets", cleanPath), // Dev/local
  ];

  for (const filePath of possiblePaths) {
    try {
      const buffer = await fs.readFile(filePath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      assetByteCache.set(cacheKey, arrayBuffer);
      return arrayBuffer;
    } catch {
      // Ignore and try next path
    }
  }

  // Fallback to fetch if no file found locally
  try {
    const response = await fetch(`${assetBaseUrl}${assetPath}`);
    if (!response.ok) {
      return null;
    }

    const buf = await response.arrayBuffer();
    assetByteCache.set(cacheKey, buf);
    return buf;
  } catch {
    return null;
  }
}

/**
 * Load font file with filesystem priority (Vercel Node runtime).
 * Falls back to fetch for development or if file not found.
 */
export async function getEmbeddedFontBuffer(fontPath: string, fontUrl: string): Promise<Uint8Array | null> {
  const cacheKey = fontUrl;

  if (fontBufferCache.has(cacheKey)) {
    const cachedValue = fontBufferCache.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
  }

  // Try filesystem paths in order
  const possiblePaths = [
    `/var/task/${fontPath}`, // Vercel serverless
    path.join(process.cwd(), fontPath), // Dev/local
  ];

  for (const filePath of possiblePaths) {
    try {
      const buffer = await fs.readFile(filePath);
      const fontBytes = new Uint8Array(buffer);
      fontBufferCache.set(cacheKey, fontBytes);
      return fontBytes;
    } catch {
      // Ignore and try next path
    }
  }

  // Fallback to fetch if no file found locally
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      return null;
    }

    const fontBuffer = await response.arrayBuffer();
    const fontBytes = new Uint8Array(fontBuffer);
    fontBufferCache.set(cacheKey, fontBytes);
    return fontBytes;
  } catch {
    return null;
  }
}

/**
 * Clear caches (useful for testing)
 */
export function clearAssetCaches(): void {
  assetByteCache.clear();
  fontBufferCache.clear();
}
