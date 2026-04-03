import { initWasm } from '@resvg/resvg-wasm';

const REMOTE_WASM_URLS = ['https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm/index_bg.wasm', 'https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'];

type ResvgWasmGlobals = {
  __resvgWasmInitPromise?: Promise<void>;
  __resvgWasmBuffer?: ArrayBuffer;
};

const G = globalThis as unknown as ResvgWasmGlobals;

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getWasmCandidates(): string[] {
  const envUrl = process.env.RESVG_WASM_URL;
  const baseUrl = process.env.BASE_URL;
  const hostedUrl = baseUrl ? `${normalizeBaseUrl(baseUrl)}/assets/vendor/resvg/index_bg.wasm` : undefined;
  return [envUrl, hostedUrl, ...REMOTE_WASM_URLS].filter((url): url is string => Boolean(url));
}

async function fetchWasmBuffer(): Promise<ArrayBuffer> {
  const candidates = getWasmCandidates();
  const failures: string[] = [];

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        failures.push(`${url} -> HTTP ${response.status}`);
        continue;
      }
      return await response.arrayBuffer();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${url} -> ${message}`);
    }
  }

  throw new Error(`Unable to fetch resvg wasm. Attempts: ${failures.join(' | ')}`);
}

export async function ensureResvgWasm(): Promise<void> {
  if (G.__resvgWasmInitPromise) {
    return G.__resvgWasmInitPromise;
  }

  G.__resvgWasmInitPromise = (async () => {
    let wasm = G.__resvgWasmBuffer;
    if (!wasm) {
      wasm = await fetchWasmBuffer();
      G.__resvgWasmBuffer = wasm;
    }

    await initWasm(wasm);
  })().catch(error => {
    G.__resvgWasmInitPromise = undefined;
    throw error;
  });

  return G.__resvgWasmInitPromise;
}
