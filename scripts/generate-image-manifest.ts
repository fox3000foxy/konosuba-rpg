import fs from 'fs';
import path from 'path';

const BASE_DIR = process.cwd();
const ASSET_DIRS = [
  'assets/background',
  'assets/mobs',
  'assets/player',
  'swordgame/art',
];

const IMAGE_TS_ROOT = path.join(BASE_DIR, 'src', 'images');
const OUT_FILE = path.join(BASE_DIR, 'src', 'utils', 'imageManifest.ts');

const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.otf', '.ttf', '.woff', '.woff2'];

function walk(dir: string): string[] {
  const full = path.join(BASE_DIR, dir);
  if (!fs.existsSync(full)) return [];

  const entries = fs.readdirSync(full, { withFileTypes: true });
  const files: string[] = [];

  entries.forEach((entry) => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(p));
    } else if (entry.isFile()) {
      if (exts.includes(path.extname(entry.name).toLowerCase())) {
        files.push(p);
      }
    }
  });

  return files;
}

function posixPath(localPath: string): string {
  return localPath.split(path.sep).join('/');
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

const loaders: Array<{ key: string; modulePath: string }> = [];

for (const dir of ASSET_DIRS) {
  const files = walk(dir);
  console.log(`Found ${files.length} files in ${dir}`);

  for (const file of files) {
    const key = path.basename(file, path.extname(file));
    const fromAssetSubpath = path.relative('assets', path.dirname(file));
    const imageTsDir = path.join(IMAGE_TS_ROOT, fromAssetSubpath);
    const targetFile = path.join(imageTsDir, `${key}.ts`);
    ensureDir(targetFile);
    const basePath = 'https://fox3000foxy.com/konosuba-rpg/';
    const modulePath = basePath + posixPath(file);
    loaders.push({ key, modulePath });
  }
}


const importsObjectEntries = loaders
  // .map((entry) => `  ${JSON.stringify(entry.key)}: () => import(${JSON.stringify(entry.modulePath)}).then((m) => m.uri)`.replace(".ts",".js"))
  .map((entry) => `  ${JSON.stringify(entry.key)}: ${JSON.stringify(entry.modulePath)}`.replace(".ts",".js"))
  .join(',\n');

const manifestContent = `// Auto-generated file. Regenerate with: bun run ts-node scripts/generate-image-manifest.ts\n\nexport const imageManifest: Record<string, string> = {\n${importsObjectEntries}\n};\n`;

fs.writeFileSync(OUT_FILE, manifestContent, 'utf8');
console.log(`Wrote image manifest: ${OUT_FILE} (${loaders.length} entries)`);
 