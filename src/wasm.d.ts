declare module '*.wasm' {
  const module: WebAssembly.Module;
  export default module;
}

// ?module
declare module '*.wasm?module' {
  const module: WebAssembly.Module;
  export default module;
}