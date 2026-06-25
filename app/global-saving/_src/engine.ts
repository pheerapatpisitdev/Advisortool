/* ============================================================
   Engine การคำนวณ — โกลบอล เซฟวิ่งส์ พลัส 15/8
   สูตรถอดจากใบเสนอขาย AdvisorZone และตรวจสอบครบทุกเซลล์ทุกไฟล์
   (เบี้ย/ทุนสะสม/เงินคืน/ครบสัญญา/คุ้มครองชีวิต/โบนัสดัชนี/IRR ตรงใบเสนอจริง)
   ============================================================ */

import { surr158Pct } from './surr158';

export type ProductId = '15-8';

export interface Product {
  id: ProductId;
  name: string;
  code: string;
  term: number;          // ระยะเวลาคุ้มครอง (ปี)
  premYears: number;     // ระยะเวลาชำระเบี้ย (ปี)
  paybackPct: number;    // เงินคืนรายปี (% ของทุน)
  maturityPct: number;   // เงินครบสัญญา (% ของทุน)
  part: number;          // อัตราการมีส่วนร่วมในผลตอบแทนดัชนี
  alive: [number, number][]; // [ปีที่จ่ายโบนัส, อัตราจ่าย%] (ตัวสุดท้าย = ครบสัญญา)
  surrPay: (y: number) => number;            // อัตราจ่ายดัชนีกรณีเวนคืน
  surrBase: (y: number, age: number) => number; // มูลค่าเวนคืนการันตี (สัดส่วนของทุน)
  premRate: (SA: number, age: number) => number; // เบี้ยต่อ 1,000 ทุน
  saFromPrem: (P: number, age: number) => number; // คำนวณทุนจากเบี้ย
  minSA?: (age: number) => number;                // ทุนประกันขั้นต่ำ (ตามอายุ)
  minPrem?: number;                               // เบี้ยประกันภัยขั้นต่ำต่อปี (บาท)
  defPrem: string;
  ageDep?: boolean;      // เบี้ย/มูลค่าเวนคืนขึ้นกับอายุไหม
  notes: string[];
}

/* อัตราเบี้ยต่อ 1,000 ทุน — ขั้นบันไดตามทุน + age loading อายุ 66+ (ถอด/ยืนยันจากใบเสนอจริง 18 อายุ) */
function baseRate158(SA: number): number {
  return SA >= 500000 ? 989 : (SA >= 100000 ? 994 : 999);
}
function rate158(SA: number, age: number): number {
  const b = baseRate158(SA);
  return age >= 66 ? Math.min(b + 5, 999) : b; // อายุ 66+ บวก loading +5 (เพดาน 999)
}

function deathFactor(y: number, pY: number): number {
  return y <= 2 ? 0 : (y < pY ? 1.05 * y : pY + 0.35);
}

export const PRODUCTS: Record<ProductId, Product> = {
  '15-8': {
    id: '15-8', name: 'โกลบอล เซฟวิ่งส์ พลัส 15/8', code: 'E15G8A',
    term: 15, premYears: 8, paybackPct: 0.01, maturityPct: 8.01, part: 0.90,
    alive: [[10, 0.30], [15, 0.70]],
    surrPay: (y) => (({ 9: .20, 10: .30, 11: .40, 12: .50, 13: .60, 14: .65, 15: .70 } as Record<number, number>)[y] || 0),
    surrBase: (y, age) => surr158Pct(y, age),
    premRate: (SA, age) => rate158(SA, age),
    saFromPrem: (P, age) => {
      const bands: [number, number, number][] = age >= 66
        ? [[994, 500000, 1e15], [999, 100000, 500000], [999, 0, 100000]]
        : [[989, 500000, 1e15], [994, 100000, 500000], [999, 0, 100000]];
      for (const [r, lo, hi] of bands) {
        const s = P / (r / 1000);
        if (s >= lo - 0.5 && s < hi + 0.5) return s;
      }
      return P / (rate158(P, age) / 1000);
    },
    minSA: (age) => (age >= 71 ? 200000 : 0),
    minPrem: 20000,
    defPrem: '50,000',
    notes: [
      '<b>เงินการันตี</b> (เงินคืนรายปี 1% ของทุน/ปี · ครบสัญญา 801% ของทุน · มูลค่าเวนคืน) ได้รับแน่นอน — <b>โบนัสตามดัชนีไม่การันตี</b> จ่ายสิ้นปี 10 และครบสัญญา',
      '<b>ลดหย่อนภาษี</b> นำเบี้ยฯ ไปลดหย่อนภาษีเงินได้บุคคลธรรมดาได้ตามจ่ายจริง <b>สูงสุด 100,000 บาท/ปี</b> เฉพาะปีที่ชำระเบี้ย (เป็นวงเงินรวมทุกกรมธรรม์ประกันชีวิตที่มีระยะคุ้มครอง ≥ 10 ปี ตามเกณฑ์กรมสรรพากร)',
      'ตัวเลขประมาณการเชิงเปรียบเทียบ อาจต่างจากใบเสนอ AdvisorZone เล็กน้อยจากการปัดเศษ · มิใช่ส่วนหนึ่งของกรมธรรม์',
    ],
  },
};

export interface YearRow { y: number; prem: number; cum: number; pay: number; death: number; exit: number; }
export interface Bonus { yr: number; pct: number; val: number; }
export interface CalcResult { rows: YearRow[]; payTot: number; mat: number; bonuses: Bonus[]; total: number; irr: number; }

function irr(cfs: [number, number][]): number {
  let lo = -0.6, hi = 1.5;
  const npv = (x: number) => cfs.reduce((s, [t, a]) => s + a / Math.pow(1 + x, t), 0);
  for (let i = 0; i < 300; i++) {
    const m = (lo + hi) / 2;
    if (npv(m) > 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

export function calc(prod: Product, SA: number, P: number, r: number, age: number): CalcResult {
  const PY = prod.premYears, T = prod.term;
  const cum = (y: number) => Math.min(y, PY) * P;
  const idx = (y: number) => Math.pow(1 + r, y);
  const rows: YearRow[] = [];
  for (let y = 1; y <= T; y++) {
    const base = prod.surrBase(y, age) * SA;
    const bonus = cum(y) * Math.max(0, idx(y) - 1) * prod.part * prod.surrPay(y);
    rows.push({
      y, prem: y <= PY ? P : 0, cum: cum(y),
      pay: y < T ? prod.paybackPct * SA : prod.maturityPct * SA,
      death: Math.max(1.02 * cum(y), deathFactor(y, PY) * SA),
      exit: base + bonus,
    });
  }
  const payTot = (T - 1) * prod.paybackPct * SA;
  const mat = prod.maturityPct * SA;
  const bonuses: Bonus[] = prod.alive.map(([yr, pct]) => ({
    yr, pct, val: cum(PY) * Math.max(0, idx(yr) - 1) * prod.part * pct,
  }));
  const total = payTot + mat + bonuses.reduce((s, b) => s + b.val, 0);
  const cf: [number, number][] = [];
  for (let t = 0; t < PY; t++) cf.push([t, -P]);
  for (let y = 1; y < T; y++) cf.push([y, prod.paybackPct * SA]);
  cf.push([T, mat]);
  bonuses.forEach((b) => { if (b.val > 0) cf.push([b.yr, b.val]); });
  return { rows, payTot, mat, bonuses, total, irr: irr(cf) * 100 };
}

/* เปรียบเทียบกับการฝากธนาคาร — ฝากเท่าเบี้ยที่จ่าย ทบต้นถึงครบสัญญา */
export const BANK_RATE = 0.0025; // 0.25% ต่อปี (คงที่)

export interface BankResult { principal: number; interest: number; total: number; rate: number; }

export function bankCompare(prod: Product, P: number, rate: number = BANK_RATE): BankResult {
  const PY = prod.premYears, T = prod.term;
  let total = 0;
  for (let t = 0; t < PY; t++) total += P * Math.pow(1 + rate, T - t);
  const principal = PY * P;
  return { principal, interest: total - principal, total, rate };
}

/* สีประจำสถานการณ์ดัชนี
   t   = สีตัวเลขในตาราง (เข้มพอผ่าน WCAG AA 4.5:1 บนพื้นขาว)
   bg  = สีพื้นหัวคอลัมน์ (อ่อน)
   bar = สีแท่งกราฟ (สด)  ·  barTx = สีตัวอักษรบนแท่ง (คอนทราสต์พอบนแท่งสด) */
export const SCEN = [
  { r: -1, t: '#54637D', bg: '#ECF0F7', bar: '#9CB2D6', barTx: '#16242F' },
  { r: 2, t: '#8A6700', bg: '#FBF1D8', bar: '#EBB52E', barTx: '#16242F' },
  { r: 3, t: '#985E00', bg: '#FCF4DD', bar: '#E0A100', barTx: '#16242F' },
  { r: 4, t: '#0F7A5F', bg: '#E6F6F0', bar: '#2BB89A', barTx: '#16242F' },
  { r: 5, t: '#0E7C62', bg: '#E3F6F0', bar: '#13A07F', barTx: '#16242F' },
];

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
