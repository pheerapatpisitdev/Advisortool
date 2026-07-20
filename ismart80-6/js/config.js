// iSmart 80/6 — config & helpers (riders, plan options, formatting). Loaded before app.js.
// Eligibility/limits transcribed from the workbook sheet 'กรอกข้อมูล' rows 19–36.
// All premium arithmetic lives in engine.js; this file only defines inputs/validation metadata.
var $ = function (id) { return document.getElementById(id); };
function fmt(n) { if (n === '' || n == null || isNaN(n)) return '0'; return Number(n).toLocaleString('th-TH', { minimumFractionDigits: (n % 1 ? 2 : 0), maximumFractionDigits: 2 }); }
function fmt0(n) { return Number(n || 0).toLocaleString('th-TH'); }

var PLAN = { code: 'W80F06', name: 'ไอสมาร์ท 80/6 (ไม่มีเงินปันผล)', payYear: 6, coverAge: 80, issueMin: 25, issueMax: 65, saMin: 150000 };

var STATE = { sex: 'หญิง', payerSex: 'ชาย', mode: 'รายปี', riders: {} };

// ctl: how the rider is controlled in the UI —
//   'pb'      payor benefit (buy + payor age/sex)     'buy' simple buy/no-buy
//   'sa'      sum-assured number                       'planMEB'/'planMEX'/'planMHP'/'planMCI' plan pickers
var RIDERS = [
  { key: 'pb',    name: 'PB Beyond',          desc: 'คุ้มครองผู้ชำระเบี้ย',            ctl: 'pb',      min: 0,  max: 70 },
  { key: 'wp',    name: 'WP Fit',             desc: 'ยกเว้นเบี้ยฯ (ทุพพลภาพ)',         ctl: 'buy',     min: 16, max: 70 },
  { key: 'ap',    name: 'AP',                 desc: 'อุบัติเหตุ',                       ctl: 'sa',      min: 0,  max: 60, smin: 100000,
    smax: function (i) { return i.age < 16 ? Math.min(2 * i.mainSA, 3000000) : Math.min(5 * i.mainSA, 10000000); } },
  { key: 'ecare', name: 'ECARE',              desc: 'อุบัติเหตุ (อีแคร์)',              ctl: 'sa',      min: 16, max: 60, smin: 100000,
    smax: function (i) { return Math.min(5 * i.mainSA, 10000000); } },
  { key: 'mex',   name: 'MEX',                desc: 'ค่ารักษาพยาบาล (MEA Extra)',       ctl: 'planMEX', min: 0,  max: 70 },
  { key: 'meb',   name: 'MEB',                desc: 'ชดเชยรายวัน',                     ctl: 'planMEB', min: 6,  max: 65 },
  { key: 'dci',   name: 'DCI',                desc: 'เสียชีวิตและโรคร้ายแรง',           ctl: 'sa',      min: 20, max: 65, smin: 200000,
    smax: function (i) { return 10000000; } },
  { key: 'pls',   name: 'PLS10',              desc: 'คุ้มครองชีวิตเพิ่ม 10 ปี',         ctl: 'sa',      min: 20, max: 59, smin: 300000,
    smax: function (i) { return 5 * i.mainSA; } },
  { key: 'cpr',   name: 'CPR',                desc: 'คุ้มครองการเสียชีวิต',             ctl: 'sa',      min: 0,  max: 65, smin: 100000,
    smax: function (i) { return Math.min(5000000, 5 * i.mainSA); } },
  { key: 'hic',   name: 'HIC',                desc: 'ชดเชยรายได้ (ต้องซื้อคู่ CPR)',    ctl: 'sa',      min: 0,  max: 65, smin: 1000,
    smax: function (i) { return 10000; }, needs: 'cpr' },
  { key: 'mhp',   name: 'iHealthy Ultra',     desc: 'ค่ารักษาพยาบาลเหมาจ่าย',           ctl: 'planMHP', min: 6,  max: 80 },
  { key: 'mci',   name: 'Roke Rai So Shield', desc: 'โรคร้ายแรงโซชิลด์',                ctl: 'planMCI', min: 0,  max: 65 },
  { key: 'ci123', name: 'CI 123',             desc: 'โรคร้ายแรง 123',                   ctl: 'sa',      min: 0,  max: 75, smin: 100000,
    smax: function (i) { return 10000000; } }
];

// Mutually-exclusive / dependency rules (checked in app.js validation):
//   WP <-> PB (choose one)   DCI <-> CPR (cannot combine)   HIC requires CPR   AP+ECARE <= 5×mainSA
var RIDER_RULES = {
  exclusive: [['wp', 'pb'], ['dci', 'cpr']],
  requires: { hic: 'cpr' }
};

var MEB_PLANS = function (age) { if (age < 11) return [500]; if (age < 16) return [500, 1000]; return [500, 1000, 2000, 3000, 4000, 5000]; };
var MEX_PLANS = function (age) { return age <= 10 ? [1200, 2200, 3200] : [1200, 2200, 3200, 4200, 6200]; };
var MHP_PLANS = function (age) {
  var p = [[1, 'Smart (สมาร์ท)'], [2, 'Bronze (บรอนซ์)']];
  if (age >= 11) p = p.concat([[3, 'Silver (ซิลเวอร์)'], [4, 'Gold (โกลด์)'], [5, 'Diamond (ไดมอนด์)'], [6, 'Platinum (แพลทินั่ม)']]);
  return p;
};
var MCI_PLANS = function (age) { return age <= 11 ? [['M', 'แผน M']] : [['XL', 'แผน XL'], ['M', 'แผน M'], ['S', 'แผน S']]; };
