// scripts/dev.js
import { spawn } from "child_process";
import chokidar from "chokidar";
import { build } from "esbuild";

let server;

function startServer() {
  if (server) server.kill();
  server = spawn("node", ["./dist/index.js"], { stdio: "inherit" });
}

async function buildAndStart() {
  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: "./dist/index.js",
    sourcemap: "inline",
    treeShaking: true,
    minify: true,
  });

  // cli equivalent: npx esbuild src/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js --sourcemap=inline
  startServer();
}

chokidar
  .watch("src", { ignoreInitial: true, ignored: /dist|\.git/ })
  .on("change", async (path) => {
    console.log(`${path} changed, rebuilding...`);
    await buildAndStart();
  });

buildAndStart();