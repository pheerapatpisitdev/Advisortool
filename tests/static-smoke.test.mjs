import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = [
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

test('all 14 primary tool entries exist and load shared gate/header versions', () => {
  assert.equal(entries.length, 14);
  for (const [tool, relativePath] of entries) {
    assert.equal(existsSync(path.join(root, relativePath)), true, `${tool}: missing entry`);
    const html = read(relativePath);
    const configAt = html.indexOf('pin-gate.config.js');
    const gateAt = html.indexOf('pin-gate.js');
    assert.ok(configAt >= 0 && gateAt > configAt, `${tool}: PIN config must load before gate`);
    assert.match(html, /global-header\.css\?v=6/, `${tool}: shared header CSS version`);
    assert.match(html, /global-header\.js\?v=7/, `${tool}: shared header JS version`);
  }
});

test('all static src/href references in the 14 entries resolve locally', () => {
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
