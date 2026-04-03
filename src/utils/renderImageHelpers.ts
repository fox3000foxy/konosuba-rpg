import * as Photon from '@cf-wasm/photon';

type CacheEntry<T> = {
  value: T;
  size: number;
};

export type SizedCache<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
};

class FifoSizedCache<T> implements SizedCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private totalSize = 0;

  constructor(
    private readonly maxSizeBytes: number,
    private readonly estimateSize: (value: T) => number
  ) {}

  get(key: string): T | undefined {
    return this.entries.get(key)?.value;
  }

  set(key: string, value: T): void {
    const size = Math.max(0, this.estimateSize(value));
    if (size > this.maxSizeBytes) {
      this.entries.clear();
      this.totalSize = 0;
      return;
    }

    const existing = this.entries.get(key);
    if (existing) {
      this.totalSize -= existing.size;
      this.entries.delete(key);
    }

    while (this.totalSize + size > this.maxSizeBytes && this.entries.size > 0) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (!oldestKey) {
        break;
      }
      const oldest = this.entries.get(oldestKey);
      if (oldest) {
        this.totalSize -= oldest.size;
      }
      this.entries.delete(oldestKey);
    }

    this.entries.set(key, { value, size });
    this.totalSize += size;
  }
}

export function createBoundedArrayBufferCache(maxSizeBytes: number): SizedCache<ArrayBuffer> {
  return new FifoSizedCache<ArrayBuffer>(maxSizeBytes, value => value.byteLength);
}

export function createBoundedStringCache(maxSizeBytes: number): SizedCache<string> {
  return new FifoSizedCache<string>(maxSizeBytes, value => Buffer.byteLength(value, 'utf8'));
}

export type RenderImageGlobals = {
  assetCache: SizedCache<ArrayBuffer>;
  resvgUriCache: SizedCache<string>;
  fontBuffer: Uint8Array | null;
  renderOutputCache: Map<string, Uint8Array>;
};

export type PendingRequests = {
  assetFetches: Map<string, Promise<ArrayBuffer | null>>;
  resvgUriConversions: Map<string, Promise<string | null>>;
};

export async function getAssetBytes(path: string | null, baseUrl: string, pendingAssetFetches: Map<string, Promise<ArrayBuffer | null>>, assetCache: SizedCache<ArrayBuffer>): Promise<ArrayBuffer | null> {
  if (!path) {
    return null;
  }

  const cached = assetCache.get(path);
  if (cached) {
    return cached;
  }

  const pending = pendingAssetFetches.get(path);
  if (pending) {
    return pending;
  }

  const request = fetch(`${baseUrl}${path}`)
    .then(async response => {
      if (!response.ok) {
        return null;
      }

      const buf = await response.arrayBuffer();
      assetCache.set(path, buf);
      return buf;
    })
    .finally(() => {
      pendingAssetFetches.delete(path);
    });

  pendingAssetFetches.set(path, request);
  return request;
}

export function toDataUri(buffer: ArrayBuffer, mimeType: string): string {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
}

export function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function getMimeTypeFromPath(path: string): string {
  const clean = path.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.gif')) return 'image/gif';
  return 'image/webp';
}

export function resolveAssetUrl(path: string | null, baseUrl: string): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function toResvgCompatibleDataUri(path: string, bytes: ArrayBuffer, resvgUriCache: SizedCache<string>): Promise<string> {
  const cached = resvgUriCache.get(path);
  if (cached) {
    return cached;
  }

  const mimeType = getMimeTypeFromPath(path);
  if (mimeType !== 'image/webp') {
    const uri = toDataUri(bytes, mimeType);
    resvgUriCache.set(path, uri);
    return uri;
  }

  try {
    const image = Photon.PhotonImage.new_from_byteslice(new Uint8Array(bytes));
    let pngBytes: Uint8Array;
    try {
      pngBytes = image.get_bytes();
    } finally {
      image.free();
    }
    const uri = toDataUri(bytesToArrayBuffer(pngBytes), 'image/png');
    resvgUriCache.set(path, uri);
    return uri;
  } catch {
    const fallback = toDataUri(bytes, mimeType);
    resvgUriCache.set(path, fallback);
    return fallback;
  }
}

export async function resolveResvgImageUri(
  path: string | null,
  baseUrl: string,
  pendingAssetFetches: Map<string, Promise<ArrayBuffer | null>>,
  pendingResvgUriConversions: Map<string, Promise<string | null>>,
  assetCache: SizedCache<ArrayBuffer>,
  resvgUriCache: SizedCache<string>
): Promise<string | null> {
  if (!path) {
    return null;
  }

  const cached = resvgUriCache.get(path);
  if (cached) {
    return cached;
  }

  const pending = pendingResvgUriConversions.get(path);
  if (pending) {
    return pending;
  }

  const conversion = (async () => {
    const bytes = await getAssetBytes(path, baseUrl, pendingAssetFetches, assetCache);
    if (!bytes) {
      return resolveAssetUrl(path, baseUrl);
    }

    return toResvgCompatibleDataUri(path, bytes, resvgUriCache);
  })().finally(() => {
    pendingResvgUriConversions.delete(path);
  });

  pendingResvgUriConversions.set(path, conversion);
  return conversion;
}

export function cacheRenderOutput(key: string, value: Uint8Array, renderOutputCache: Map<string, Uint8Array>, maxSize: number): void {
  if (renderOutputCache.has(key)) {
    renderOutputCache.delete(key);
  } else if (renderOutputCache.size >= maxSize) {
    const oldestKey = renderOutputCache.keys().next().value as string | undefined;
    if (oldestKey) {
      renderOutputCache.delete(oldestKey);
    }
  }

  renderOutputCache.set(key, value);
}

export function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
