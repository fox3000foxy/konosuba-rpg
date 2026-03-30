import { initWasm } from '@resvg/resvg-wasm';

const WASM_URL = 'https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm';

type ResvgWasmGlobals = {
  __resvgWasmInitPromise?: Promise<void>;
  __resvgWasmBuffer?: ArrayBuffer;
};

const G = globalThis as unknown as ResvgWasmGlobals;

export async function ensureResvgWasm(): Promise<void> {
  if (G.__resvgWasmInitPromise) {
    return G.__resvgWasmInitPromise;
  }

  G.__resvgWasmInitPromise = (async () => {
    let wasm = G.__resvgWasmBuffer;
    if (!wasm) {
      const response = await fetch(WASM_URL);
      if (!response.ok) {
        throw new Error(`WASM fetch failed: ${response.status}`);
      }
      wasm = await response.arrayBuffer();
      G.__resvgWasmBuffer = wasm;
    }

    await initWasm(wasm);
  })();

  return G.__resvgWasmInitPromise;
}
