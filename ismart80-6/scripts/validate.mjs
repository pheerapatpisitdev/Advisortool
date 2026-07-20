// iSmart 80/6 engine validation harness (Node). Loads the SHIPPING data.js + engine.js
// and asserts against Excel-computed ground truth. Run: node ismart80-6/scripts/validate.mjs
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
global.window = {};
new Function(readFileSync(new URL('../js/data.js', import.meta.url), 'utf8'))();
new Function(readFileSync(new URL('../js/engine.js', import.meta.url), 'utf8'))();
const IS80 = window.IS80, DATA = window.DATA, CV = window.CV;

// ---- Task 6: main premium (age 44 F, SA 1,000,000, annual) ----
const m = IS80.calcMain(DATA, { age: 44, sex: 'หญิง', sa: 1000000, mode: 'รายปี' });
assert.strictEqual(m.annual, 287000, `main.annual ${m.annual}`);
assert.strictEqual(m.mode, 287000, `main.mode ${m.mode}`);
console.log('Task 6 main premium: PASS');

// ---- Task 7: benefit illustration table (age 44 F, SA 1,000,000, annual) ----
const bt = IS80.benefitTable(DATA, CV, { age: 44, sex: 'หญิง', sa: 1000000, mode: 'รายปี', annualTotalMain: 287000 });
const y = n => bt.find(r => r.year === n);
assert.strictEqual(y(1).cashback, 10000, `y1 cashback ${y(1).cashback}`);
assert.strictEqual(y(1).death, 2000000, `y1 death ${y(1).death}`);
assert.strictEqual(y(1).surrender, 45000, `y1 surrender ${y(1).surrender}`);
assert.strictEqual(y(2).accum, 20050, `y2 accum ${y(2).accum}`);
assert.strictEqual(y(2).deathInclCoupons, 2010000, `y2 I ${y(2).deathInclCoupons}`);
assert.strictEqual(y(3).surrender, 467000, `y3 surrender ${y(3).surrender}`);
assert.strictEqual(y(5).surrender, 1043000, `y5 surrender ${y(5).surrender}`);
assert.strictEqual(y(6).cashback, 20000, `y6 cashback ${y(6).cashback}`);
assert.strictEqual(y(7).premium, 0, `y7 premium ${y(7).premium}`);
assert.strictEqual(y(7).surrender, 1290000, `y7 surrender ${y(7).surrender}`);
assert.strictEqual(bt[bt.length - 1].age, 79, `last age ${bt[bt.length - 1].age}`);
// accum precision check (Excel: y3 30150.25, y5 50502.50625625)
assert.ok(Math.abs(y(3).accum - 30150.25) < 1e-6, `y3 accum ${y(3).accum}`);
assert.ok(Math.abs(y(5).accum - 50502.50625625) < 1e-6, `y5 accum ${y(5).accum}`);
console.log('Task 7 benefit table: PASS');

// ---- Task 9/18: riders + totals vs LibreOffice ground truth (groundtruth.json) ----
const GT = JSON.parse(readFileSync(new URL('../groundtruth.json', import.meta.url), 'utf8'));
function mkInp(m) {
  const inp = { age: m.C5, sex: m.C6, sa: m.D19, mode: 'รายปี', occ: 1 };
  if (m.D20 === 'ซื้อ') inp.pb = { buy: true, type: 'PB Beyond', payerAge: m.C11, payerSex: m.C12 };
  if (m.D21 === 'ซื้อ') inp.wp = { buy: true };
  if (m.D22) inp.ap = { sa: m.D22 };
  if (m.D23) inp.ecare = { sa: m.D23 };
  if (m.D24 && m.D24 !== 'ไม่ซื้อ') inp.mex = { plan: m.D24 };
  if (m.D25 && m.D25 !== 'ไม่ซื้อ') inp.meb = { plan: m.D25 };
  if (m.D26) inp.dci = { sa: m.D26 };
  if (m.D27) inp.pls = { sa: m.D27 };
  if (m.D28) inp.cpr = { sa: m.D28 };
  if (m.D29) inp.hic = { sa: m.D29 };
  if (m.D33) inp.ci123 = { sa: m.D33 };
  return inp;
}
const RN = { AP: 'AP', ECARE: 'ECARE', MEX: 'MEX', MEB: 'MEB', DCI: 'DCI', PLS: 'PLS', CPR: 'CPR', HIC: 'HIC', PB: 'PB (', WP: 'WP Fit' };
let gtFails = 0;
for (const [tag, sc] of Object.entries(GT)) {
  const inp = mkInp(sc.inputs), res = IS80.calc(DATA, CV, inp), o = sc.out;
  const rid = frag => res.riders.find(r => r.name.indexOf(frag) >= 0);
  const chk = (label, got, exp) => { if (Math.round((got - exp) * 100) !== 0) { console.error(`  ${tag} ${label}: got ${got} exp ${exp}`); gtFails++; } };
  chk('main', res.main.mode, o.main);
  for (const k of Object.keys(RN)) if (o[k]) { const r = rid(RN[k]); chk(k, r ? r.mode : 0, o[k]); }
  if (o.CI123) { const ci = rid('CI 123'); chk('CI123', ci ? ci.mode : 0, o.CI123 + o.CI123_e1 + o.CI123_e2 + o.CI123_e3); }
  chk('TOTAL', res.modeTotal, o.TOTAL);
}
assert.strictEqual(gtFails, 0, `${gtFails} ground-truth mismatches`);
console.log(`Task 9/18 ground truth (${Object.keys(GT).length} scenarios): PASS`);
