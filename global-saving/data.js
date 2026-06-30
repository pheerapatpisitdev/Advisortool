/* ============================================================
   Engine การคำนวณ — โกลบอล เซฟวิ่งส์ พลัส 15/8  (ported verbatim from engine.ts + surr158.ts)
   ============================================================ */

/* ---------- surr158.ts ---------- */
var SURR158_AGES = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,66,70,71,75];
var SURR158_BY_AGE = {
  0: [0.0,11.0,93.9,197.2,323.8,431.7,542.8,657.2,675.9,695.1,714.8,735.2,756.2,777.8,801.0],
  5: [0.0,11.1,94.1,197.3,324.0,431.9,543.0,657.4,676.0,695.2,714.9,735.2,756.2,777.8,801.0],
  10: [0.0,11.3,94.4,197.7,324.4,432.2,543.2,657.6,676.1,695.3,715.0,735.3,756.2,777.8,801.0],
  15: [0.0,11.5,94.7,197.9,324.6,432.3,543.3,657.7,676.2,695.3,715.0,735.3,756.2,777.8,801.0],
  20: [0.0,11.6,94.8,198.1,324.7,432.4,543.4,657.7,676.2,695.3,715.0,735.3,756.2,777.8,801.0],
  25: [0.0,11.7,95.0,198.2,324.8,432.6,543.5,657.8,676.4,695.4,715.1,735.3,756.2,777.8,801.0],
  30: [0.0,11.9,95.3,198.6,325.2,432.9,543.8,658.1,676.5,695.6,715.2,735.4,756.3,777.8,801.0],
  35: [0.0,12.3,95.8,199.1,325.7,433.4,544.2,658.4,676.8,695.8,715.4,735.5,756.3,777.8,801.0],
  40: [0.0,12.8,96.6,199.9,326.5,434.1,544.9,659.0,677.2,696.1,715.6,735.7,756.4,777.9,801.0],
  45: [0.0,13.5,97.7,201.1,327.7,435.2,545.8,659.7,677.9,696.6,716.0,735.9,756.6,777.9,801.0],
  50: [0.0,14.8,99.6,203.1,329.8,437.0,547.4,661.1,679.1,697.6,716.7,736.4,756.9,778.0,801.0],
  55: [0.0,17.0,102.9,206.7,333.5,440.4,550.4,663.7,681.2,699.3,718.0,737.3,757.4,778.2,801.0],
  60: [0.0,20.8,108.8,212.9,340.0,446.3,555.7,668.2,685.0,702.3,720.3,738.9,758.3,778.6,801.0],
  65: [0.0,26.0,118.7,223.5,350.9,456.2,564.5,675.8,691.3,707.3,724.0,741.4,759.8,779.2,801.0],
  66: [0.0,33.2,125.8,228.7,353.7,458.8,566.7,677.7,692.9,708.6,724.9,742.0,760.1,779.4,801.0],
  70: [0.0,50.4,139.2,242.6,368.0,471.9,578.5,688.1,701.8,716.1,731.2,746.4,762.7,780.5,801.0],
  71: [0.0,53.8,143.0,246.7,372.2,475.7,581.9,691.1,704.5,718.5,732.4,747.3,763.2,780.7,801.0],
  75: [3.0,68.2,159.6,264.0,390.1,492.5,596.5,703.5,714.4,725.9,738.1,751.3,765.7,781.8,801.0],
};
function surr158Pct(y, age) {
  var A = SURR158_AGES;
  var a = Math.max(A[0], Math.min(A[A.length - 1], age));
  if (a <= A[0]) return SURR158_BY_AGE[A[0]][y - 1] / 100;
  for (var i = 1; i < A.length; i++) {
    if (a <= A[i]) {
      var lo = A[i - 1], hi = A[i];
      var vlo = SURR158_BY_AGE[lo][y - 1], vhi = SURR158_BY_AGE[hi][y - 1];
      return (vlo + (vhi - vlo) * (a - lo) / (hi - lo)) / 100;
    }
  }
  return SURR158_BY_AGE[A[A.length - 1]][y - 1] / 100;
}

/* ---------- engine.ts ---------- */
function baseRate158(SA) {
  return SA >= 500000 ? 989 : (SA >= 100000 ? 994 : 999);
}
function rate158(SA, age) {
  var b = baseRate158(SA);
  return age >= 66 ? Math.min(b + 5, 999) : b;
}
function deathFactor(y, pY) {
  return y <= 2 ? 0 : (y < pY ? 1.05 * y : pY + 0.35);
}

var PRODUCTS = {
  '15-8': {
    id: '15-8', name: 'โกลบอล เซฟวิ่งส์ พลัส 15/8', code: 'E15G8A',
    term: 15, premYears: 8, paybackPct: 0.01, maturityPct: 8.01, part: 0.90,
    alive: [[10, 0.30], [15, 0.70]],
    surrPay: function (y) { return ({ 9: .20, 10: .30, 11: .40, 12: .50, 13: .60, 14: .65, 15: .70 })[y] || 0; },
    surrBase: function (y, age) { return surr158Pct(y, age); },
    premRate: function (SA, age) { return rate158(SA, age); },
    saFromPrem: function (P, age) {
      var bands = age >= 66
        ? [[994, 500000, 1e15], [999, 100000, 500000], [999, 0, 100000]]
        : [[989, 500000, 1e15], [994, 100000, 500000], [999, 0, 100000]];
      for (var k = 0; k < bands.length; k++) {
        var r = bands[k][0], lo = bands[k][1], hi = bands[k][2];
        var s = P / (r / 1000);
        if (s >= lo - 0.5 && s < hi + 0.5) return s;
      }
      return P / (rate158(P, age) / 1000);
    },
    minSA: function (age) { return age >= 71 ? 200000 : 0; },
    minPrem: 20000,
    defPrem: '50,000',
    notes: [
      '<b>เงินการันตี</b> (เงินคืนรายปี 1% ของทุน/ปี · ครบสัญญา 801% ของทุน · มูลค่าเวนคืน) ได้รับแน่นอน — <b>โบนัสตามดัชนีไม่การันตี</b> จ่ายสิ้นปี 10 และครบสัญญา',
      '<b>ลดหย่อนภาษี</b> นำเบี้ยฯ ไปลดหย่อนภาษีเงินได้บุคคลธรรมดาได้ตามจ่ายจริง <b>สูงสุด 100,000 บาท/ปี</b> เฉพาะปีที่ชำระเบี้ย (เป็นวงเงินรวมทุกกรมธรรม์ประกันชีวิตที่มีระยะคุ้มครอง ≥ 10 ปี ตามเกณฑ์กรมสรรพากร)',
      'ตัวเลขประมาณการเชิงเปรียบเทียบ อาจต่างจากใบเสนอ AdvisorZone เล็กน้อยจากการปัดเศษ · มิใช่ส่วนหนึ่งของกรมธรรม์',
    ],
  },
};

function irr(cfs) {
  var lo = -0.6, hi = 1.5;
  var npv = function (x) { return cfs.reduce(function (s, c) { return s + c[1] / Math.pow(1 + x, c[0]); }, 0); };
  for (var i = 0; i < 300; i++) {
    var m = (lo + hi) / 2;
    if (npv(m) > 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

function calc(prod, SA, P, r, age) {
  var PY = prod.premYears, T = prod.term;
  var cum = function (y) { return Math.min(y, PY) * P; };
  var idx = function (y) { return Math.pow(1 + r, y); };
  var rows = [];
  for (var y = 1; y <= T; y++) {
    var base = prod.surrBase(y, age) * SA;
    var bonus = cum(y) * Math.max(0, idx(y) - 1) * prod.part * prod.surrPay(y);
    rows.push({
      y: y, prem: y <= PY ? P : 0, cum: cum(y),
      pay: y < T ? prod.paybackPct * SA : prod.maturityPct * SA,
      death: Math.max(1.02 * cum(y), deathFactor(y, PY) * SA),
      exit: base + bonus,
    });
  }
  var payTot = (T - 1) * prod.paybackPct * SA;
  var mat = prod.maturityPct * SA;
  var bonuses = prod.alive.map(function (m) {
    return { yr: m[0], pct: m[1], val: cum(PY) * Math.max(0, idx(m[0]) - 1) * prod.part * m[1] };
  });
  var total = payTot + mat + bonuses.reduce(function (s, b) { return s + b.val; }, 0);
  var cf = [];
  for (var t = 0; t < PY; t++) cf.push([t, -P]);
  for (var yy = 1; yy < T; yy++) cf.push([yy, prod.paybackPct * SA]);
  cf.push([T, mat]);
  bonuses.forEach(function (b) { if (b.val > 0) cf.push([b.yr, b.val]); });
  return { rows: rows, payTot: payTot, mat: mat, bonuses: bonuses, total: total, irr: irr(cf) * 100 };
}

var BANK_RATE = 0.0025;
function bankCompare(prod, P, rate) {
  if (rate === undefined) rate = BANK_RATE;
  var PY = prod.premYears, T = prod.term;
  var total = 0;
  for (var t = 0; t < PY; t++) total += P * Math.pow(1 + rate, T - t);
  var principal = PY * P;
  return { principal: principal, interest: total - principal, total: total, rate: rate };
}

var SCEN = [
  { r: -1, t: '#54637D', bg: '#ECF0F7', bar: '#9CB2D6', barTx: '#16242F' },
  { r: 2, t: '#8A6700', bg: '#FBF1D8', bar: '#EBB52E', barTx: '#16242F' },
  { r: 3, t: '#985E00', bg: '#FCF4DD', bar: '#E0A100', barTx: '#16242F' },
  { r: 4, t: '#0F7A5F', bg: '#E6F6F0', bar: '#2BB89A', barTx: '#16242F' },
  { r: 5, t: '#0E7C62', bg: '#E3F6F0', bar: '#13A07F', barTx: '#16242F' },
];

var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };

/* ---------- Factsheet data (from Documents.tsx) ---------- */
var FACTSHEET = {
  annualReturns: {
    2546: 7.87, 2547: 6.20, 2548: 6.36, 2549: 4.07, 2550: 5.22, 2551: 3.66, 2552: 0.97,
    2553: 5.58, 2554: 2.48, 2555: 6.23, 2556: 9.81, 2557: 5.62, 2558: -5.33, 2559: 5.51,
    2560: 7.45, 2561: 0.59, 2562: 11.58, 2563: 5.89, 2564: 2.42, 2565: -3.21, 2566: 3.31,
    2567: -0.16, 2568: 5.77,
  },
  baseYear: 2545,
  groups: [
    { name: 'หุ้น', items: [
      { th: 'หุ้นสหรัฐฯ', en: 'US Equity', pct: 16.68, color: '#1E4E79' },
      { th: 'หุ้นยุโรป', en: 'Eurozone Equity', pct: 8.33, color: '#2E6CA4' },
      { th: 'หุ้นญี่ปุ่น', en: 'Japan Equity', pct: 2.78, color: '#5C9BD1' }] },
    { name: 'พันธบัตรรัฐบาล', items: [
      { th: 'พันธบัตรรัฐบาลสหรัฐฯ', en: 'US Gov Bond', pct: 20.08, color: '#1F6F5C' },
      { th: 'พันธบัตรรัฐบาลยุโรป', en: 'EU Gov Bond', pct: 20.08, color: '#2E9179' },
      { th: 'พันธบัตรรัฐบาลญี่ปุ่น', en: 'Japan Gov Bond', pct: 10.04, color: '#6BBFA3' }] },
    { name: 'ตราสารหนี้เอกชน', items: [
      { th: 'ตราสารหนี้เอกชน', en: 'Corporate Credit', pct: 11.37, color: '#6B5B95' }] },
    { name: 'โภคภัณฑ์', items: [
      { th: 'สินค้าโภคภัณฑ์อื่น', en: 'Other Commodities', pct: 7.09, color: '#C8772E' },
      { th: 'โลหะมีค่า', en: 'Precious Metals', pct: 3.54, color: '#C7A24E' }] },
  ],
  eventBands: [
    { from: 2557, to: 2558, text: 'วิกฤตหนี้กรีซ และจุดเปลี่ยนดอกเบี้ยสหรัฐฯ', row: 0 },
    { from: 2563, to: 2563, text: 'ช่วงสถานการณ์โควิด', row: 0 },
    { from: 2565, to: 2565, text: 'ตลาดผันผวนตามทิศทางดอกเบี้ยสหรัฐฯ', row: 1 },
  ],
};
