import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const require = createRequire(import.meta.url);

function loadWindowData(relativePath, property) {
  const source = readFileSync(path.join(root, relativePath), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  new vm.Script(source, { filename: relativePath }).runInContext(sandbox, { timeout: 1500 });
  if (!sandbox.window[property]) throw new Error(`ไม่พบชุดข้อมูล ${property}`);
  return sandbox.window[property];
}

let ci123Data;
let ihealthyData;
let pensionEngine;

function integer(value, label, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new RangeError(`${label} ต้องอยู่ระหว่าง ${min}–${max}`);
  return number;
}

function positive(value, label, max = 100_000_000) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > max) throw new RangeError(`${label} ไม่ถูกต้อง`);
  return number;
}

function genderCode(value) {
  if (value === 'male' || value === 'M' || value === 'ชาย') return 'male';
  if (value === 'female' || value === 'F' || value === 'หญิง') return 'female';
  throw new RangeError('เพศต้องเป็น male หรือ female');
}

export function calculateCI123(input) {
  const age = integer(input.age, 'อายุ', 0, 70);
  const gender = genderCode(input.gender);
  const sumAssured = integer(input.sumAssured, 'ทุนประกัน', 100_000, 10_000_000);
  ci123Data ||= loadWindowData('ci123/data.js', 'CI123_PREMIUMS');
  const rows = ci123Data[String(sumAssured)];
  if (!rows) throw new RangeError(`ทุนประกัน ${sumAssured.toLocaleString('th-TH')} บาทไม่มีในตาราง CI 123`);
  const row = rows.find((item) => item.age === age);
  if (!row) throw new RangeError('ไม่พบอายุในตาราง CI 123');
  const annual = Number(row[gender]);
  return {
    kind: 'calculation', calculator: 'ci123', productId: 'ci123', source: 'ci123/data.js + สูตรใน ci123/index.html',
    inputs: { age, gender, sumAssured },
    result: { annual, semiannual: Math.round(annual * 0.52), monthly: Math.round(annual * 0.09) },
    currency: 'THB', calculatorUrl: '../ci123/',
    disclaimer: 'ตัวเลขจากตารางในเครื่องมือปัจจุบัน ต้องตรวจเอกสารเสนอขายและผลการพิจารณารับประกันจริง'
  };
}

export function calculateIHealthy(input) {
  const age = integer(input.age, 'อายุ', 6, 80);
  const gender = genderCode(input.gender);
  const plan = String(input.plan || '').toLowerCase();
  if (!['smart', 'bronze', 'silver', 'gold'].includes(plan)) throw new RangeError('แผนต้องเป็น smart, bronze, silver หรือ gold');
  if (age <= 10 && !['smart', 'bronze'].includes(plan)) throw new RangeError('อายุ 6–10 ปีเลือกได้เฉพาะ Smart หรือ Bronze');
  const frequency = String(input.frequency || 'yearly');
  const factor = { yearly: 1, 'six-monthly': 0.52, monthly: 0.09 }[frequency];
  if (!factor) throw new RangeError('ความถี่ต้องเป็น yearly, six-monthly หรือ monthly');
  ihealthyData ||= loadWindowData('ihealthy/data.js', 'IH_PREMIUM');
  const rows = ihealthyData[plan]?.[gender];
  const exact = rows?.find((row) => row.age === age);
  const fallback = exact || rows?.filter((row) => row.age < age).at(-1);
  if (!fallback) throw new RangeError('ไม่พบอายุและแผนในตาราง iHealthy Ultra');
  return {
    kind: 'calculation', calculator: 'ihealthy', productId: 'ihealthy', source: 'ihealthy/data.js + สูตรใน ihealthy/index.html',
    inputs: { age, gender, plan, frequency }, result: { premium: Math.round(fallback.yearly * factor), annual: fallback.yearly },
    currency: 'THB', calculatorUrl: '../ihealthy/',
    disclaimer: 'เบี้ยเป็นข้อมูลตามตารางในเครื่องมือ ไม่รวมผลการพิจารณารับประกัน เงื่อนไข หรือข้อยกเว้นเฉพาะบุคคล'
  };
}

export function calculatePension(input) {
  const age = integer(input.age, 'อายุ', 20, 64);
  const gender = genderCode(input.gender) === 'male' ? 'ชาย' : 'หญิง';
  const annuityAge = integer(input.annuityAge, 'อายุเริ่มรับบำนาญ', 55, 70);
  if (![55, 60, 65, 70].includes(annuityAge)) throw new RangeError('อายุเริ่มรับบำนาญต้องเป็น 55, 60, 65 หรือ 70');
  const payOption = input.payOption === 'to_annuity' ? 'ชำระเบี้ย จนรับเงินบำนาญ' : 'ชำระเบี้ย 6 ปี';
  const mode = { annual: 'รายปี', semiannual: 'ราย 6 เดือน', quarterly: 'ราย 3 เดือน', monthly: 'รายเดือน' }[input.mode || 'annual'];
  if (!mode) throw new RangeError('งวดชำระไม่ถูกต้อง');
  const inputType = { sum_assured: 'จำนวนเงินเอาประกันภัย', premium: 'เบี้ยประกันภัย', monthly_pension: 'เงินบำนาญรายเดือน' }[input.inputType || 'sum_assured'];
  if (!inputType) throw new RangeError('ประเภทจำนวนเงินไม่ถูกต้อง');
  const amount = positive(input.amount, 'จำนวนเงิน');
  if (!pensionEngine) {
    const DB = JSON.parse(readFileSync(path.join(root, 'pension-smart95/data/db.json'), 'utf8'));
    const exported = require(path.join(root, 'pension-smart95/src/engine.js'));
    pensionEngine = new exported.PensionEngine(DB);
  }
  const available = pensionEngine.availablePlans(age, payOption);
  if (!available.some((plan) => plan.annuityAge === annuityAge)) throw new RangeError('อายุหรือทางเลือกชำระเบี้ยไม่อยู่ในเกณฑ์ของแผนที่เลือก');
  const quote = pensionEngine.compute({ age, gender, annuityAge, payOption, mode, inputType, amount, riders: {} });
  if (quote.error || !quote.base?.rate) throw new RangeError(quote.error || 'ไม่พบอัตราเบี้ยสำหรับข้อมูลนี้');
  return {
    kind: 'calculation', calculator: 'pension', productId: 'pension-smart95', source: 'pension-smart95/src/engine.js + data/db.json',
    inputs: { age, gender, annuityAge, payOption, mode, inputType, amount },
    result: {
      sumAssured: quote.base.SA, installmentPremium: quote.totalModePremium, annualPremium: quote.totalAnnualPremium,
      payYears: quote.base.payYears, firstAnnualAnnuity: quote.annuitySchedule?.[0]?.amount ?? null,
      irrPercent: quote.irr == null ? null : quote.irr * 100
    },
    currency: 'THB', calculatorUrl: '../pension-smart95/',
    disclaimer: 'คำนวณด้วย engine A2026-1 โดยยังไม่รวมสัญญาเพิ่มเติม ภาษีจริงขึ้นกับเงื่อนไขและฐานภาษีของแต่ละบุคคล'
  };
}

export const TOOL_HANDLERS = Object.freeze({
  calculate_ci123: calculateCI123,
  calculate_ihealthy: calculateIHealthy,
  calculate_pension: calculatePension
});
