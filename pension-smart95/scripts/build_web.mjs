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
copyFileSync(join(root, '../assets/advisortool-mark.png'), join(assets, 'advisortool-mark.png'));
copyFileSync(join(root, '../assets/advisortool-wordmark.png'), join(assets, 'advisortool-wordmark.png'));
copyFileSync(join(root, '../assets/favicon.png'), join(assets, 'favicon.png'));

// rewrite index.html asset paths -> assets/
// The source tags carry cache-busting queries (?v=N) bumped independently of this
// script, so match the path and drop whatever query rides along.
const ref = (attr, path) =>
  new RegExp(`${attr}="${path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(\\?[^"]*)?"`);
let html = readFileSync(join(root, 'index.html'), 'utf8')
  .replace(ref('href', 'src/styles.css'), 'href="assets/styles.css"')
  .replace(ref('href', '../assets/theme.css'), 'href="assets/theme.css"')
  .replace(ref('href', '../assets/global-header.css'), 'href="assets/global-header.css"')
  .replace(ref('href', '../assets/favicon.png'), 'href="assets/favicon.png?v=20260719"')
  .replace(ref('src', '../assets/global-header.js'), 'src="assets/global-header.js?v=6"')
  .replace(ref('src', '../assets/advisortool-mark.png'), 'src="assets/advisortool-mark.png?v=20260719-2"')
  .replace(ref('src', 'data/db.js'), 'src="assets/db.js"')
  .replace(ref('src', 'src/engine.js'), 'src="assets/engine.js"')
  .replace(ref('src', 'src/app.js'), 'src="assets/app.js"');

// fail loudly rather than shipping a dist/web that silently 404s its own assets
const stale = html.match(/(href|src)="(\.\.\/assets\/|src\/|data\/)[^"]*"/g) || [];
const unresolved = stale.filter(t => !/pin-gate|supabase|click-sound/.test(t));
if (unresolved.length) {
  console.error('✗ build:web failed: unresolved asset refs →', unresolved.join(', '));
  process.exit(1);
}
writeFileSync(join(web, 'index.html'), html);

console.log('✓ static site → dist/web/  (index.html + assets/)  — deploy this folder');
