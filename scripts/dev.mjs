// scripts/dev.js
import { spawn } from "child_process";
import chokidar from "chokidar";
import { build } from "esbuild";

let server;
async function startServer() {
  if (server) server.kill();
  server = await spawn("node", ["./dist/index.js"], { stdio: "inherit" });
  server.on("close", (code) => {
    if (code !== null && code !== 0) {
      console.error(`Server process exited with code ${code}`);
    }
  });
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
  await startServer();
}

chokidar
  .watch("src", { ignoreInitial: true, ignored: /dist|\.git/ })
  .on("change", async (path) => {
    console.log(`${path} changed, rebuilding...`);
    await buildAndStart();
  });

buildAndStart();