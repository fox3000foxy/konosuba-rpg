import fs from 'fs';
import path from 'path';

const BASE_DIR = process.cwd();
const ASSET_DIRS = [
  'assets/background',
  'assets/mobs',
  'assets/player',
  'swordgame/art'
];
const OUT_FILE = path.join(BASE_DIR, 'src', 'utils', 'imageManifest.ts');

const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

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

const manifest: Record<string, string> = {};

for (const dir of ASSET_DIRS) {
  const files = walk(dir);
  console.log(`Found ${files.length} files in ${dir}`);
  for (const file of files) {
    const fullPath = path.join(BASE_DIR, file);
    const ext = path.extname(file).toLowerCase().replace('.', '');
    const key = path.basename(file, path.extname(file));
    if (manifest[key]) {
      console.warn(`Duplicate key ${key} from ${file}, overriding previous value.`);
    }
    const buffer = fs.readFileSync(fullPath);
    const dataUrl = `data:image/${ext};base64,${buffer.toString('base64')}`;
    manifest[key] = dataUrl;
  }
}

const fileContent = `// Auto-generated file. Regenerate with: pnpm ts-node scripts/generate-image-manifest.ts\n
export const imageManifest: Record<string, string> = ${JSON.stringify(manifest, null, 2)};\n`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, fileContent, 'utf8');
console.log(`Wrote image manifest: ${OUT_FILE} (${Object.keys(manifest).length} entries)`);
