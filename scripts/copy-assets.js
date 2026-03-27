// scripts/copy-assets.js
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

function copyFolder(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const file of readdirSync(src)) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    if (statSync(srcPath).isDirectory()) {
      copyFolder(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyFolder("assets", ".vercel/output/static/assets");