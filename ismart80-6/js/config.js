// iSmart 80/6 — config & helpers (riders, plan options, formatting). Loaded before app.js.
// Eligibility/limits transcribed from the workbook sheet 'กรอกข้อมูล' rows 19–36.
// All premium arithmetic lives in engine.js; this file only defines inputs/validation metadata.
var $ = function (id) { return document.getElementById(id); };
function fmt(n) { if (n === '' || n == null || isNaN(n)) return '0'; return Number(n).toLocaleString('th-TH', { minimumFractionDigits: (n % 1 ? 2 : 0), maximumFractionDigits: 2 }); }
function fmt0(n) { return Number(n || 0).toLocaleString('th-TH'); }

var PLAN = { code: 'W80F06', name: 'ไอสมาร์ท 80/6 (ไม่มีเงินปันผล)', payYear: 6, coverAge: 80, issueMin: 25, issueMax: 65, saMin: 150000 };

var STATE = { sex: 'หญิง', mode: 'รายปี', riders: {} };

// ctl: how the rider is controlled in the UI —
//   'buy'  simple buy/no-buy    'sa'  sum-assured number    'planMHP'  iHealthy Ultra plan picker
var RIDERS = [
  { key: 'wp',    name: 'WP Fit',             desc: 'ยกเว้นเบี้ยฯ (ทุพพลภาพ)',         ctl: 'buy',     min: 16, max: 70 },
  { key: 'dci',   name: 'DCI',                desc: 'เสียชีวิตและโรคร้ายแรง',           ctl: 'sa',      min: 20, max: 65, smin: 200000,
    smax: function (i) { return 10000000; } },
  { key: 'mhp',   name: 'iHealthy Ultra',     desc: 'ค่ารักษาพยาบาลเหมาจ่าย',           ctl: 'planMHP', min: 6,  max: 80 },
  { key: 'ci123', name: 'CI 123',             desc: 'โรคร้ายแรง 123',                   ctl: 'sa',      min: 0,  max: 75, smin: 100000,
    smax: function (i) { return 10000000; } }
];

// Mutually-exclusive / dependency rules (checked in app.js validation).
// No active rules remain after trimming to WP Fit / DCI / iHealthy Ultra / CI 123.
var RIDER_RULES = {
  exclusive: [],
  requires: {}
};

var MHP_PLANS = function (age) {
  var p = [[1, 'Smart (สมาร์ท)'], [2, 'Bronze (บรอนซ์)']];
  if (age >= 11) p = p.concat([[3, 'Silver (ซิลเวอร์)'], [4, 'Gold (โกลด์)'], [5, 'Diamond (ไดมอนด์)'], [6, 'Platinum (แพลทินั่ม)']]);
  return p;
};
