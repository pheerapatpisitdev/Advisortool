// Build the single self-contained HTML (everything inlined) into dist/.
// Good for emailing / offline use. Usage: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const OUT_NAME = 'โปรแกรมคำนวณเบี้ย-บำนาญสมาร์ท95.html';

let html = read('index.html');
const css = read('src/styles.css');
const db = read('data/db.js');
const engine = read('src/engine.js');
const app = read('src/app.js');

html = html.replace('<link rel="stylesheet" href="src/styles.css">', `<style>\n${css}\n</style>`);
html = html.replace('<script src="data/db.js"></script>', `<script>${db}</script>`);
html = html.replace('<script src="src/engine.js"></script>', `<script>${engine}</script>`);
html = html.replace('<script src="src/app.js"></script>', `<script>${app}</script>`);

for (const ref of ['src/styles.css', 'data/db.js', 'src="src/engine.js"', 'src="src/app.js"']) {
  if (html.includes(ref)) { console.error('✗ build failed: unresolved ref', ref); process.exit(1); }
}

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', OUT_NAME), html);
console.log(`✓ single-file → dist/${OUT_NAME}  (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
