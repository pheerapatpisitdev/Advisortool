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
