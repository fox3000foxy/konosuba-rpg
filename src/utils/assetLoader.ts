import fs from 'fs/promises';
import path from 'path';

const assetByteCache = new Map<string, ArrayBuffer>();
const fontBufferCache = new Map<string, Uint8Array>();

/**
 * Load asset bytes with filesystem priority (Vercel Node runtime).
 * Falls back to fetch for development or if file not found.
 */
export async function getAssetBytes(assetPath: string, assetBaseUrl: string): Promise<ArrayBuffer | null> {
  const cacheKey = `${assetBaseUrl}${assetPath}`;
  
  if (assetByteCache.has(cacheKey)) {
    return assetByteCache.get(cacheKey)!;
  }

  // Try filesystem first (Vercel Node runtime)
  try {
    const filePath = path.join(process.cwd(), 'assets', assetPath.replace(/^\/assets\//, ''));
    const buffer = await fs.readFile(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    assetByteCache.set(cacheKey, arrayBuffer);
    // console.log(`Loaded asset from filesystem: ${filePath}`);
    return arrayBuffer;
  } catch {
    // Fallthrough to fetch if file not found
    console.warn(`Asset not found on filesystem: ${assetPath}, falling back to fetch.`);
  }

  // Fallback to fetch for development or if file not found
  try {
    const response = await fetch(`${assetBaseUrl}${assetPath}`);
    if (!response.ok) {
      return null;
    }

    const buf = await response.arrayBuffer();
    assetByteCache.set(cacheKey, buf);
    return buf;
  } catch {
    console.error(`Failed to fetch asset: ${assetPath}`);
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
    return fontBufferCache.get(cacheKey)!;
  }

  // Try filesystem first (Vercel Node runtime)
  try {
    const filePath = path.join(process.cwd(), fontPath);
    const buffer = await fs.readFile(filePath);
    const fontBytes = new Uint8Array(buffer);
    fontBufferCache.set(cacheKey, fontBytes);
    return fontBytes;
  } catch {
    console.warn(`Font not found on filesystem: ${fontPath}, falling back to fetch.`);
  }

  // Fallback to fetch for development or if file not found
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
    console.error(`Failed to fetch font: ${fontUrl}`);
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
