// Build a clean static-site folder in dist/web/ — index.html + assets/.
// Drop dist/web/ onto any static host (Netlify, Cloudflare Pages, GitHub Pages, S3…).
// Usage: node scripts/build_web.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, 'dist', 'web');
const assets = join(web, 'assets');
rmSync(web, { recursive: true, force: true });
mkdirSync(assets, { recursive: true });

// copy assets into one flat folder
copyFileSync(join(root, 'src/styles.css'), join(assets, 'styles.css'));
copyFileSync(join(root, 'src/engine.js'), join(assets, 'engine.js'));
copyFileSync(join(root, 'src/app.js'), join(assets, 'app.js'));
copyFileSync(join(root, 'data/db.js'), join(assets, 'db.js'));
copyFileSync(join(root, '../assets/theme.css'), join(assets, 'theme.css'));
copyFileSync(join(root, '../assets/global-header.css'), join(assets, 'global-header.css'));
copyFileSync(join(root, '../assets/global-header.js'), join(assets, 'global-header.js'));

// rewrite index.html asset paths -> assets/
let html = readFileSync(join(root, 'index.html'), 'utf8')
  .replace('href="src/styles.css?v=2"', 'href="assets/styles.css"')
  .replace('href="../assets/theme.css?v=1"', 'href="assets/theme.css"')
  .replace('href="../assets/global-header.css"', 'href="assets/global-header.css"')
  .replace(/src="..\/assets\/global-header.js[^"]*"/, 'src="assets/global-header.js"')
  .replace('src="data/db.js"', 'src="assets/db.js"')
  .replace('src="src/engine.js"', 'src="assets/engine.js"')
  .replace('src="src/app.js"', 'src="assets/app.js"');
writeFileSync(join(web, 'index.html'), html);

console.log('✓ static site → dist/web/  (index.html + assets/)  — deploy this folder');
