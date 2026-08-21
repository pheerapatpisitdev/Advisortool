import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = [
  ['advisor', 'advisor/index.html'],
  ['life-treasure', 'life-treasure/index.html'],
  ['12pl', '12pl/index.html'],
  ['easy-protect6', 'easy-protect6/index.html'],
  ['lifeready', 'lifeready/index.html'],
  ['ismart80-6', 'ismart80-6/index.html'],
  ['global-saving', 'global-saving/index.html'],
  ['pension-smart95', 'pension-smart95/index.html'],
  ['ihealthy', 'ihealthy/index.html'],
  ['ci123', 'ci123/index.html'],
  ['ishield', 'ishield/index.html'],
  ['group-insurance', 'group-insurance/index.html'],
  ['fhc', 'fhc/index.html'],
  ['career-agent', 'career-agent/index.html'],
  ['agency', 'agency/index.html']
];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function localReferences(html) {
  return [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((value) => value && !/^(?:[a-z]+:|#|\/\/)/i.test(value))
    .filter((value) => !/[${}]/.test(value))
    .map((value) => value.split(/[?#]/)[0])
    .filter(Boolean);
}

function pageBundle(relativePath) {
  const html = read(relativePath);
  const baseDir = path.dirname(path.join(root, relativePath));
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
    .map((match) => match[1].split(/[?#]/)[0])
    .filter((source) => source && !/^(?:[a-z]+:|\/\/)/i.test(source))
    .map((source) => path.resolve(baseDir, source))
    .filter((source) => source.startsWith(root) && existsSync(source))
    .map((source) => readFileSync(source, 'utf8'));
  return [html, ...scripts].join('\n');
}

test('all 15 primary tool entries exist and load shared gate/header versions', () => {
  assert.equal(entries.length, 15);
  for (const [tool, relativePath] of entries) {
    assert.equal(existsSync(path.join(root, relativePath)), true, `${tool}: missing entry`);
    const html = read(relativePath);
    const configAt = html.indexOf('pin-gate.config.js');
    const gateAt = html.indexOf('pin-gate.js');
    assert.ok(configAt >= 0 && gateAt > configAt, `${tool}: PIN config must load before gate`);
    assert.match(html, /global-header\.css\?v=10/, `${tool}: shared header CSS version`);
    assert.match(html, /global-header\.js\?v=10/, `${tool}: shared header JS version`);
  }
});

test('shared visual system applies to every registered tool except iHealthy', () => {
  const js = read('assets/global-header.js');
  const css = read('assets/global-header.css');
  const design = read('assets/design-system.css');
  assert.match(css, /design-system\.css\?v=4/);
  assert.match(js, /metadata\.title !== 'iHealthy Ultra'/);
  assert.match(js, /classList\.add\('az-unified'\)/);
  assert.match(design, /body\.az-unified/);
  assert.match(design, /\.az-system-footer/);
});

test('group-insurance app shell keeps its sidebar gutter against the shared design system', () => {
  // assets/design-system.css centers every <main> (max-width + margin-inline:auto) and
  // outranks Tailwind's .lg\:ml-72, which left the 288px fixed sidebar covering the page
  // content. The page must keep an override that restores the gutter.
  const design = read('assets/design-system.css');
  assert.match(design, /:where\(main[^)]*\)[^}]*margin-left:\s*auto/s, 'design system still centers <main>');

  const html = read('group-insurance/index.html');
  const app = read('group-insurance/app.js');
  assert.match(app, /<main class="[^"]*lg:ml-72/, 'app shell still relies on lg:ml-72');
  assert.match(html, /#app main\s*{[^}]*max-width:\s*none\s*!important/, 'missing max-width override');
  assert.match(html, /@media \(min-width:\s*1024px\)\s*{\s*#app main\s*{[^}]*margin-left:\s*18rem\s*!important/, 'missing desktop sidebar gutter');
});

test('group-insurance keeps its accessibility and mobile safeguards', () => {
  const html = read('group-insurance/index.html');
  const app = read('group-insurance/app.js');

  // touch targets, iOS zoom, dialog scroll lock, sideways-scroll hint
  assert.match(html, /min-height:\s*44px/, 'missing 44px touch-target floor');
  assert.match(html, /#app input, #app select[^{]*{[^}]*font-size:\s*16px/, 'inputs must stay >=16px or iOS zooms');
  assert.match(html, /html\.gi-modal-open[^{]*{[^}]*overflow:\s*hidden/, 'missing dialog scroll lock');
  assert.match(html, /\.gi-hscroll\.is-scrollable::after/, 'missing horizontal-scroll affordance');
  assert.match(html, /\.gi-sr-only/, 'missing screen-reader-only helper');

  // semantics that screen readers depend on
  assert.match(app, /aria-hidden="true" focusable="false"/, 'decorative icons must be hidden from a11y tree');
  assert.match(app, /aria-current="page"/, 'active nav item must expose aria-current');
  assert.match(app, /aria-pressed="/, 'language toggle must expose pressed state');
  assert.match(app, /aria-labelledby="quote-modal-title"/, 'quote dialog needs an accessible name');
  assert.match(app, /<caption class="gi-sr-only">/, 'data tables need a caption');
  assert.match(app, /for="gi-count-/, 'count field must be label-associated');
  assert.match(app, /for="gi-biz-/, 'business-type select must be label-associated');
  // one <h1> template per view (health / PA / business type) and nothing above it:
  // the sidebar brand and the sticky sub-header must not emit headings.
  // count closing tags: the surrounding code comments mention "<h1>" in prose.
  assert.equal((app.match(/<\/h1>/g) || []).length, 3, 'expected exactly one h1 per view');
  assert.doesNotMatch(app, /<h1[^>]*>' \+ esc\(t\('groupInsurance'\)\)/, 'sidebar brand must not be an <h1>');
  assert.doesNotMatch(app, /<h2[^>]*>' \+ esc\(t\(pageTitleKey\(\)\)\)/, 'sticky sub-header must not be an <h2>');

  // the 1,099-row table must stay sliced + debounced, not full-rendered per keystroke
  assert.match(app, /state\.bizLimit/, 'business-type list must render a capped slice');
  const debounce = app.match(/bizPaintTimer = setTimeout\(paintBizTable, (\d+)\)/);
  assert.ok(debounce && Number(debounce[1]) >= 100, 'search repaint must stay debounced by >=100ms');
  assert.doesNotMatch(app, /if \(el\.id === 'biz-search'\).*render\(\)/, 'search must not trigger a full re-render');

  // views must be linkable and Back-able
  assert.match(app, /history\.pushState/, 'nav must push a history entry');
  assert.match(app, /addEventListener\('popstate'/, 'Back must be handled');
});

test('all static src/href references in the 15 entries resolve locally', () => {
  for (const [tool, relativePath] of entries) {
    const absoluteEntry = path.join(root, relativePath);
    const baseDir = path.dirname(absoluteEntry);
    for (const reference of localReferences(read(relativePath))) {
      const target = reference.startsWith('/')
        ? path.join(root, reference.replace(/^\/+/, ''))
        : path.resolve(baseDir, reference);
      assert.equal(existsSync(target), true, `${tool}: missing local reference ${reference}`);
    }
  }
});

test('shared metadata covers all tools and remains print-safe', () => {
  const js = read('assets/global-header.js');
  const css = read('assets/global-header.css');
  for (const [tool] of entries) {
    assert.ok(js.includes(`'${tool}': { title:`), `${tool}: missing metadata`);
  }
  assert.match(js, /วันที่ตรวจสถานะ/);
  assert.match(js, /ไม่ใช่ใบเสนอราคา/);
  assert.match(css, /@media print\s*\{[^}]*\.az-meta[^}]*display:\s*none/s);
});

test('export and LINE affordances remain present where advertised', () => {
  const exportTools = ['life-treasure', '12pl', 'easy-protect6', 'lifeready', 'ismart80-6', 'global-saving', 'pension-smart95', 'ihealthy', 'ci123', 'ishield', 'group-insurance', 'fhc'];
  const lineTools = ['ihealthy', 'ci123', 'group-insurance', 'fhc', 'career-agent'];
  const byTool = Object.fromEntries(entries.map(([tool, relativePath]) => [tool, pageBundle(relativePath)]));
  for (const tool of exportTools) {
    assert.match(byTool[tool], /azPrint|window\.print|jsPDF|html2canvas|toDataURL/, `${tool}: export/print hook missing`);
  }
  for (const tool of lineTools) {
    assert.match(byTool[tool], /line\.me\//, `${tool}: LINE share hook missing`);
  }
  const agencyPages = ['agency/calculator.html', 'agency/bonus-calculator.html'].map(read).join('\n');
  assert.match(agencyPages, /line\.me\//, 'agency: LINE share hook missing from calculator pages');
});

test('FHC and Career-Agent do not silently persist questionnaire data', () => {
  for (const relativePath of ['fhc/index.html', 'career-agent/index.html']) {
    const html = read(relativePath);
    assert.doesNotMatch(html, /fetch\s*\(|supabase\.co|career_responses|fhc_responses/i);
  }
});
