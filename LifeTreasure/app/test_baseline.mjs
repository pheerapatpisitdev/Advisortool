// เทสต์เอนจินเทียบกับค่า cached ในไฟล์ Excel (เคสที่บันทึกไว้ในไฟล์)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Engine = require('./engine.js');
const R = require('./rates.json');

const inp = {
  name: 'คุณคนพิเศษ', age: 30, gender: 'ชาย', mode: 'รายปี',
  payorAge: 35, payorGender: 'ชาย',
  plan: 'ชำระเบี้ย 18 ปี', sa: 20000000,
  pbVariant: 'PB Beyond', pbBuy: '', pbMult: 1,
  wpVariant: 'WP Fit', wpBuy: '', wpMult: 1,
  apSa: 0, apOcc: 1, ecareSa: 0, ecareOcc: 1,
  mexPlan: 1200, mexOcc: 1,
  mebPlan: '', mebOcc: 1,
  dciSa: 0, plsVariant: 'PLS10', plsSa: 0,
  cprSa: 0, hicPlan: '',
  ihuPlan: 'PLATINUM', ihuCoverage: 'Deductible', ihuArea: 'ประเทศไทย', ihuOcc: 1,
  rokePlan: 'แผน S', rokeOcc: 4,
  ci123Sa: 5000000,
};

const out = Engine.calc(inp, R);
const get = id => out.items.find(i => i.id === id);

const expected = [
  ['main premium', out.main.premium, 506000],
  ['pb', get('pb').premium, 0],
  ['wp', get('wp').premium, 0],
  ['ap', get('ap').premium, 0],
  ['ecare', get('ecare').premium, 0],
  ['mex', get('mex').premium, 5499],
  ['meb', get('meb').premium, 0],
  ['dci', get('dci').premium, 0],
  ['pls', get('pls').premium, 0],
  ['cpr', get('cpr').premium, 0],
  ['hic', get('hic').premium, 0],
  ['ihu', get('ihu').premium, 98000],
  ['roke', get('roke').premium, 2382],
  ['ci123', get('ci123').premium, 11500],
  ['ci123_pre', get('ci123_pre').premium, 62],
  ['ci123_ei', get('ci123_ei').premium, 925],
  ['ci123_sp', get('ci123_sp').premium, 415],
  ['total', out.totalPerPeriod, 624783],
  ['firstPayment', out.firstPayment, 624783],
  ['displaySa', out.displaySa, 20000000],
  // ตารางผลประโยชน์ (จาก cached: แถวปี 1,2,7,18,49,51,67)
  ['ill y1 prem', out.illustration[0].premium, 506000],
  ['ill y1 cum', out.illustration[0].cumPremium, 506000],
  ['ill y1 cv', out.illustration[0].cv, 0],
  ['ill y1 death', out.illustration[0].death, 20000000],
  ['ill y2 cv', out.illustration[1].cv, 180000],
  ['ill y7 cv', out.illustration[6].cv, 2300000],
  ['ill y18 cum', out.illustration[17].cumPremium, 9108000],
  ['ill y18 cv', out.illustration[17].cv, 7840000],
  ['ill y49 prem', out.illustration[48].premium, 0],
  ['ill y49 cv', out.illustration[48].cv, 15740000],
  ['ill y51 cv', out.illustration[50].cv, 16140000],
  ['ill y67 cv', out.illustration[66].cv, 18920000],
  ['ill rows', out.illustration.length, 69],
];

let fail = 0;
for (const [name, got, want] of expected) {
  const ok = got === want;
  if (!ok) { fail++; console.log(`FAIL ${name}: got ${got} want ${want}`); }
}
console.log(fail === 0 ? `ALL ${expected.length} CHECKS PASSED` : `${fail} FAILURES`);
process.exit(fail ? 1 : 0);
