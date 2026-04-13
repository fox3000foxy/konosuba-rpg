type ResvgModule = {
  Resvg: new (
    svg: string,
    options?: unknown,
  ) => {
    render(): {
      asPng(): Uint8Array;
    };
  };
};

type ResvgGlobals = {
  __resvgModulePromise?: Promise<ResvgModule>;
};

const G = globalThis as unknown as ResvgGlobals;

function getResvgModule(): Promise<ResvgModule> {
  if (!G.__resvgModulePromise) {
    G.__resvgModulePromise = import("@cf-wasm/resvg") as Promise<ResvgModule>;
  }

  return G.__resvgModulePromise;
}

// Uses @cf-wasm/resvg conditional exports (node/workerd) based on runtime.
export async function ensureResvgWasm(): Promise<void> {
  await getResvgModule();
}

export async function renderSvgToPng(svg: string, options?: unknown): Promise<Uint8Array> {
  const { Resvg } = await getResvgModule();
  return new Resvg(svg, options).render().asPng();
}
