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
const theme = read('../assets/theme.css');
const ghCss = read('../assets/global-header.css');
// Strip global-header.js's leading doc comment: it documents how *other*, non-inlined
// pages should include this file (`<link ... href="../assets/...">`), so left in place
// it would leave stray "../assets/" text sitting inertly inside the single-file build.
const ghJs  = read('../assets/global-header.js').replace(/^\/\*[\s\S]*?\*\/\s*/, '');

// The inlined global-header.js/theme.css/global-header.css bodies legitimately contain
// text like `<link ... href="../assets/global-header.css" />` in their own doc comments
// (they document how OTHER, non-inlined pages should include them). That means a plain
// "does the final html still contain this bare ref" scan would always false-positive
// once those files are spliced in. So for these three, assert the *source* tag was
// actually present (and got replaced) up front, instead of re-scanning the final html.
function mustReplace(str, from, to, label) {
  if (!str.includes(from)) { console.error('✗ build failed: unresolved ref', label); process.exit(1); }
  return str.replace(from, to);
}

html = mustReplace(html, '<link rel="stylesheet" href="../assets/global-header.css" />', `<style>\n${ghCss}\n</style>`, '../assets/global-header.css');
html = mustReplace(html, '<link rel="stylesheet" href="../assets/theme.css?v=1" />', `<style>\n${theme}\n</style>`, '../assets/theme.css');
if (!/<script src="\.\.\/assets\/global-header.js[^"]*"><\/script>/.test(html)) { console.error('✗ build failed: unresolved ref', '../assets/global-header.js'); process.exit(1); }
html = html.replace(/<script src="..\/assets\/global-header.js[^"]*"><\/script>/, `<script>${ghJs}</script>`);
html = html.replace('<link rel="stylesheet" href="src/styles.css?v=2">', `<style>\n${css}\n</style>`);
html = html.replace('<script src="data/db.js"></script>', `<script>${db}</script>`);
html = html.replace('<script src="src/engine.js"></script>', `<script>${engine}</script>`);
html = html.replace('<script src="src/app.js"></script>', `<script>${app}</script>`);

for (const ref of ['src/styles.css', 'data/db.js', 'src="src/engine.js"', 'src="src/app.js"']) {
  if (html.includes(ref)) { console.error('✗ build failed: unresolved ref', ref); process.exit(1); }
}

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', OUT_NAME), html);
console.log(`✓ single-file → dist/${OUT_NAME}  (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
