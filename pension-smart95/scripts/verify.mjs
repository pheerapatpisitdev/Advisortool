// Verify the engine against the Excel "oracle" (values recomputed in LibreOffice)
// plus a robustness sweep. Exit 0 if all pass, 1 otherwise.
// Usage: node scripts/verify.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const DB = JSON.parse(readFileSync(join(root, 'data/db.json'), 'utf8'));
const { PensionEngine } = require(join(root, 'src/engine.js'));
const oracle = JSON.parse(readFileSync(join(root, 'test/oracle/recalc_results.json'), 'utf8'));
const illusO = JSON.parse(readFileSync(join(root, 'test/oracle/oracle_illustration.json'), 'utf8'));
const eng = new PensionEngine(DB);

let pass = 0, fail = 0;
const near = (a, b, t = 0.02) => Math.abs((a || 0) - (b || 0)) <= t;
const check = (name, got, exp, t) => { const ok = near(got, exp, t); ok ? pass++ : fail++; if (!ok) console.log(`  ✗ ${name}: got ${got}, expected ${exp}`); };

// 1) main premium (all plans / genders / 3 input modes / 4 payment modes)
for (const o of Object.values(oracle)) {
  const r = eng.resolveMain(o.case);
  check(`main SA ${JSON.stringify(o.case)}`, r.SA, o.SA, 2);
  check(`main rate`, r.rate, o.rate);
  check(`main modePrem`, r.modePremium, o.mainMode);
}

// 2) riders (age 40 male, base plan 95/70) — oracle values from LibreOffice
const b = eng.resolveMain({ age: 40, gender: 'ชาย', annuityAge: 70, payOption: 'ชำระเบี้ย จนรับเงินบำนาญ', inputType: 'จำนวนเงินเอาประกันภัย', amount: 100000 });
b.__age = 40; b.__gender = 'ชาย';
const riderCases = [
  ['AP', eng.riderAP(b, { sa: 1000000, occ: 1 }), 3000],
  ['ECARE', eng.riderECARE(b, { sa: 1000000, occ: 1 }), 6500],
  ['MEB', eng.riderMEB(b, { plan: 1000, occ: 1 }), 1300],
  ['DCI', eng.riderDCI(b, { sa: 500000 }), 2760],
  ['PLS10', eng.riderPLS(b, { code: 'PLS10', sa: 1000000 }), 5640],
  ['CPR', eng.riderCPR(b, { sa: 500000 }), 435],
  ['HIC', eng.riderHIC(b, { sa: 10000 }), 129.9],
  ['MHP', eng.riderMHP(b, { plan: 'SMART', area: 'ประเทศไทย', coverage: 'Full', occ: 1 }), 17700],
  ['MCI', eng.riderMCI(b, { plan: 'S', occ: 1 }), 3885],
  ['MEX', eng.riderMEX(b, { plan: 1200, occ: 1 }), 6799]
];
for (const [n, r, exp] of riderCases) check(`rider ${n}`, r ? r.annual : null, exp, 0.01);

// 3) full annual illustration (age 40 male 95/70 SA 100k) — 275 values
const ba = eng.resolveMain({ age: 40, gender: 'ชาย', annuityAge: 70, payOption: 'ชำระเบี้ย จนรับเงินบำนาญ', inputType: 'จำนวนเงินเอาประกันภัย', amount: 100000 });
ba.__age = 40; ba.__gender = 'ชาย';
const byAge = {}; eng.illustration(ba).forEach(r => byAge[r.age] = r);
for (const o of illusO) {
  const e = byAge[o.age]; if (!e) continue;
  const deathExp = o.age < 70 ? o.death : o.deathDuring;
  [['prem', e.premium, o.prem], ['cumPrem', e.cumPremium, o.cumPrem], ['cv', e.cashValue, o.cv],
   ['pension', e.pension, o.pension], ['death', e.deathBenefit, deathExp]].forEach(([m, ev, ov]) => { if (ov != null) check(`illus ${o.age} ${m}`, ev, ov, 1.5); });
}

// 4) tax optimizer (Excel: F29=53889, F33=5388.9)
const tax = eng.tax({ income: 100000, pvd: 10000, gpf: 123123, teacher: 456, rmf: 123, existingOrdinaryLife: 50000, existingAnnuity: 11111, marginalRate: 0.1 });
check('tax maxAnnuity', tax.maxAnnuityPremium, 53889);
check('tax benefit', tax.taxBenefit, 5388.9, 0.01);

// 5) robustness sweep — every valid (gender, payOption, annuityAge, age, mode), expect finite results
let swept = 0, sweepIssues = 0;
for (const g of ['ชาย', 'หญิง']) for (const po of ['ชำระเบี้ย จนรับเงินบำนาญ', 'ชำระเบี้ย 6 ปี']) for (const aa of [55, 60, 65, 70])
  for (let age = 20; age <= 65; age++) for (const mode of ['รายปี', 'รายเดือน']) {
    if (!eng.availablePlans(age, po).some(p => p.annuityAge === aa)) continue;
    const res = eng.compute({ age, gender: g, annuityAge: aa, payOption: po, inputType: 'จำนวนเงินเอาประกันภัย', amount: 100000, mode, riders: {} });
    swept++;
    const vals = [res.base && res.base.modePremium, res.totalModePremium, res.base && res.base.SA];
    if (res.error || vals.some(x => x == null || isNaN(x) || x < 0)) sweepIssues++;
  }
check(`robustness sweep (${swept} combos, 0 issues)`, sweepIssues, 0);

console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed  (incl. ${swept} sweep combos)`);
process.exit(fail === 0 ? 0 : 1);
