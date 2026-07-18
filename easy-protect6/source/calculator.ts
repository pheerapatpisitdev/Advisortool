import sourceData from "./data/easy-protect-rates.json";
import sourceRiderData from "./data/rider-rates.json";

export type Gender = "M" | "F";
export type PaymentMode = "annual" | "semiannual" | "quarterly" | "monthly";
export type HealthPlan = "" | "SMART" | "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM";
export type HealthCoverage = "full" | "deductible";
export type HealthRegion = "TH" | "ASIA" | "WORLD";
export type ShieldPlan = "" | "S" | "M" | "L" | "XL";

export interface RiderInput {
  pb: boolean;
  pbMultiplier: number;
  payorAge: number;
  payorGender: Gender;
  wp: boolean;
  wpMultiplier: number;
  ap: number;
  apClass: number;
  ecare: number;
  ecareClass: number;
  mex: number;
  mexClass: number;
  meb: number;
  mebClass: number;
  dci: number;
  pls10: number;
  cpr: number;
  hic: number;
  ihealthyPlan: HealthPlan;
  ihealthyCoverage: HealthCoverage;
  ihealthyRegion: HealthRegion;
  ihealthyClass: number;
  shieldPlan: ShieldPlan;
  shieldClass: number;
  ci123: number;
}

export interface QuoteInput {
  customerName: string;
  age: number;
  gender: Gender;
  mode: PaymentMode;
  sumAssured: number;
  riders: RiderInput;
}

export type QuoteInputDraft = Omit<Partial<QuoteInput>, "riders"> & {
  riders?: Partial<RiderInput>;
};

export interface BenefitRow {
  age: number;
  policyYear: number;
  annualPremium: number;
  accumulatedPremium: number;
  deathBenefit: number;
  cashSurrenderValue: number;
  isPaymentYear: boolean;
  isMaturity: boolean;
}

export interface RiderPremium {
  code: string;
  label: string;
  coverage: string;
  annualPremium: number;
  installmentPremium: number;
  annualizedPremium: number;
}

export interface Quote {
  input: QuoteInput;
  premiumRate: number;
  installmentPremium: number;
  annualizedPremium: number;
  riderInstallmentPremium: number;
  riderAnnualizedPremium: number;
  totalInstallmentPremium: number;
  totalAnnualizedPremium: number;
  totalPremium: number;
  maturityBenefit: number;
  irr: number | null;
  selectedRiders: RiderPremium[];
  validationErrors: string[];
  rows: BenefitRow[];
}

type RateData = {
  premiumRates: Record<Gender, Record<string, number>>;
  cashValues: Record<Gender, Record<string, Record<string, number>>>;
  modes: Record<PaymentMode, { label: string; factor: number; paymentsPerYear: number }>;
  product: {
    name: string;
    planCode: string;
    premiumPaymentYears: number;
    coverageToAge: number;
    maxTableAge: number;
    minIssueAge: number;
    maxIssueAge: number;
    minSumAssured: number;
    version: string;
  };
};

type RiderRateData = {
  waiverMultipliers: Record<string, number>;
  apRates: Record<string, number>;
  ecareRates: Record<string, number>;
  wp: Record<Gender, Record<string, number>>;
  pb: { parent: Record<string, number>; spouse: Record<string, number> };
  meb: Record<string, Record<string, number>>;
  lifeRiders: Record<string, Record<Gender, number>>;
  mex: Record<string, Record<string, number>>;
  ihealthy: Record<string, Record<string, number>>;
  shield: Record<string, Record<string, number>>;
  ci123: Record<string, Record<string, number>>;
};

export const rateData = sourceData as RateData;
const riderRateData = sourceRiderData as RiderRateData;

export const genderLabels: Record<Gender, string> = { M: "ชาย", F: "หญิง" };

export const paymentModeLabels: Record<PaymentMode, string> = {
  annual: "รายปี",
  semiannual: "ราย 6 เดือน",
  quarterly: "ราย 3 เดือน",
  monthly: "รายเดือน",
};

export const healthPlanLabels: Record<Exclude<HealthPlan, "">, string> = {
  SMART: "สมาร์ท",
  BRONZE: "บรอนซ์",
  SILVER: "ซิลเวอร์",
  GOLD: "โกลด์",
  DIAMOND: "ไดมอนด์",
  PLATINUM: "แพลทินั่ม",
};

export const healthCoverageLabels: Record<HealthCoverage, string> = {
  full: "คุ้มครองเต็มจำนวน",
  deductible: "แบบมีความรับผิดส่วนแรก",
};

export const healthRegionLabels: Record<HealthRegion, string> = {
  TH: "ประเทศไทย",
  ASIA: "เอเชีย",
  WORLD: "ทั่วโลก",
};

export const shieldPlanLabels: Record<Exclude<ShieldPlan, "">, string> = {
  S: "แผน S",
  M: "แผน M",
  L: "แผน L",
  XL: "แผน XL",
};

export const defaultRiders: RiderInput = {
  pb: false,
  pbMultiplier: 1,
  payorAge: 35,
  payorGender: "M",
  wp: false,
  wpMultiplier: 1,
  ap: 0,
  apClass: 1,
  ecare: 0,
  ecareClass: 1,
  mex: 0,
  mexClass: 1,
  meb: 0,
  mebClass: 1,
  dci: 0,
  pls10: 0,
  cpr: 0,
  hic: 0,
  ihealthyPlan: "",
  ihealthyCoverage: "full",
  ihealthyRegion: "TH",
  ihealthyClass: 1,
  shieldPlan: "",
  shieldClass: 1,
  ci123: 0,
};

function floorTo(value: number, decimals: number) {
  const scale = 10 ** decimals;
  const floatingPointCorrection = Math.max(1e-9, Math.abs(value) * Number.EPSILON * 8);
  return Math.floor((value + floatingPointCorrection) * scale) / scale;
}

function calculateBaseInstallmentPremium(sumAssured: number, premiumRate: number, mode: PaymentMode) {
  const standardAnnualPremium = floorTo(premiumRate * floorTo(sumAssured / 1000, 3), 2);
  return floorTo(standardAnnualPremium * rateData.modes[mode].factor, 2);
}

/**
 * Returns the nearest whole-thousand sum assured for a desired base-policy
 * installment premium. Riders are intentionally excluded because their price
 * changes with the selected rider and coverage options.
 */
export function calculateSumAssuredFromPremium({
  age,
  gender,
  mode,
  premium,
}: Pick<QuoteInput, "age" | "gender" | "mode"> & { premium: number }) {
  const normalizedAge = Math.min(rateData.product.maxIssueAge, Math.max(rateData.product.minIssueAge, Math.trunc(Number(age) || 0)));
  const normalizedGender: Gender = gender === "F" ? "F" : "M";
  const normalizedMode: PaymentMode = Object.prototype.hasOwnProperty.call(rateData.modes, mode) ? mode : "annual";
  const desiredPremium = Math.max(0, Number(premium) || 0);
  const premiumRate = rateData.premiumRates[normalizedGender][String(normalizedAge)];
  const factor = rateData.modes[normalizedMode].factor;
  const minimum = rateData.product.minSumAssured;
  const estimated = Math.max(minimum, Math.round((desiredPremium / (premiumRate * factor) * 1000) / 1000) * 1000);

  let best = estimated;
  let bestDifference = Math.abs(calculateBaseInstallmentPremium(best, premiumRate, normalizedMode) - desiredPremium);

  for (let offset = -5; offset <= 5; offset += 1) {
    const candidate = Math.max(minimum, estimated + offset * 1000);
    const difference = Math.abs(calculateBaseInstallmentPremium(candidate, premiumRate, normalizedMode) - desiredPremium);
    if (difference < bestDifference || (difference === bestDifference && candidate < best)) {
      best = candidate;
      bestDifference = difference;
    }
  }

  return best;
}

function roundTo(value: number, decimals: number) {
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function normalizeAmount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

function normalizeClass(value: unknown) {
  const number = Math.trunc(Number(value));
  return [1, 2, 3, 4].includes(number) ? number : 1;
}

function normalizeMultiplier(value: unknown) {
  const number = Number(value);
  return [1, 1.5, 2].includes(number) ? number : 1;
}

function netPresentValue(rate: number, cashFlows: number[]) {
  return cashFlows.reduce((total, cashFlow, period) => total + cashFlow / (1 + rate) ** period, 0);
}

function calculateIrr(cashFlows: number[]) {
  if (!cashFlows.some((value) => value < 0) || !cashFlows.some((value) => value > 0)) return null;
  let low = -0.9999;
  let high = 1;
  let lowValue = netPresentValue(low, cashFlows);
  let highValue = netPresentValue(high, cashFlows);
  while (lowValue * highValue > 0 && high < 1024) {
    high *= 2;
    highValue = netPresentValue(high, cashFlows);
  }
  if (lowValue * highValue > 0) return null;
  for (let iteration = 0; iteration < 160; iteration += 1) {
    const midpoint = (low + high) / 2;
    const midpointValue = netPresentValue(midpoint, cashFlows);
    if (Math.abs(midpointValue) < 1e-9) return midpoint;
    if (lowValue * midpointValue <= 0) high = midpoint;
    else {
      low = midpoint;
      lowValue = midpointValue;
    }
  }
  return (low + high) / 2;
}

export function normalizeInput(input: QuoteInputDraft): QuoteInput {
  const rawAge = Number(input.age);
  const rawSumAssured = Number(input.sumAssured);
  const age = Math.min(rateData.product.maxIssueAge, Math.max(rateData.product.minIssueAge, Math.trunc(Number.isFinite(rawAge) ? rawAge : 35)));
  const sumAssured = Math.max(rateData.product.minSumAssured, Math.trunc(Number.isFinite(rawSumAssured) ? rawSumAssured : rateData.product.minSumAssured));
  const gender: Gender = input.gender === "F" ? "F" : "M";
  const mode: PaymentMode = Object.prototype.hasOwnProperty.call(rateData.modes, input.mode ?? "") ? (input.mode as PaymentMode) : "annual";
  const rawRiders = input.riders ?? {};
  const healthPlans: HealthPlan[] = ["", "SMART", "BRONZE", "SILVER", "GOLD", "DIAMOND", "PLATINUM"];
  const healthRegions: HealthRegion[] = ["TH", "ASIA", "WORLD"];

  return {
    customerName: String(input.customerName ?? "").trim().slice(0, 120),
    age,
    gender,
    mode,
    sumAssured,
    riders: {
      pb: rawRiders.pb === true,
      pbMultiplier: normalizeMultiplier(rawRiders.pbMultiplier),
      payorAge: Math.trunc(Number(rawRiders.payorAge) || 35),
      payorGender: rawRiders.payorGender === "F" ? "F" : "M",
      wp: rawRiders.wp === true,
      wpMultiplier: normalizeMultiplier(rawRiders.wpMultiplier),
      ap: 0,
      apClass: 1,
      ecare: 0,
      ecareClass: 1,
      mex: 0,
      mexClass: 1,
      meb: normalizeAmount(rawRiders.meb),
      mebClass: normalizeClass(rawRiders.mebClass),
      dci: normalizeAmount(rawRiders.dci),
      pls10: normalizeAmount(rawRiders.pls10),
      cpr: 0,
      hic: 0,
      ihealthyPlan: healthPlans.includes(rawRiders.ihealthyPlan as HealthPlan) ? (rawRiders.ihealthyPlan as HealthPlan) : "",
      ihealthyCoverage: rawRiders.ihealthyCoverage === "deductible" ? "deductible" : "full",
      ihealthyRegion: healthRegions.includes(rawRiders.ihealthyRegion as HealthRegion) ? (rawRiders.ihealthyRegion as HealthRegion) : "TH",
      ihealthyClass: normalizeClass(rawRiders.ihealthyClass),
      shieldPlan: "",
      shieldClass: 1,
      ci123: normalizeAmount(rawRiders.ci123),
    },
  };
}

export function calculateQuote(rawInput: QuoteInputDraft): Quote {
  const input = normalizeInput(rawInput);
  const { riders } = input;
  const premiumRate = rateData.premiumRates[input.gender][String(input.age)];
  const mode = rateData.modes[input.mode];
  const sumAssuredUnits = floorTo(input.sumAssured / 1000, 3);
  const installmentPremium = calculateBaseInstallmentPremium(input.sumAssured, premiumRate, input.mode);
  const annualizedPremium = installmentPremium * mode.paymentsPerYear;
  const cashValueRates = rateData.cashValues[input.gender][String(input.age)];
  const policyYears = rateData.product.coverageToAge - input.age;
  const validationErrors: string[] = [];
  const selectedRiders: RiderPremium[] = [];
  const addError = (message: string) => {
    if (!validationErrors.includes(message)) validationErrors.push(message);
  };
  const addRider = (code: string, label: string, coverage: string, annual: number, modal?: number) => {
    const installment = modal ?? floorTo(annual * mode.factor, 2);
    selectedRiders.push({
      code,
      label,
      coverage,
      annualPremium: annual,
      installmentPremium: installment,
      annualizedPremium: installment * mode.paymentsPerYear,
    });
  };
  const occupationMultiplier = (occupationClass: number) => occupationClass === 4 ? 1.5 : 1;

  if (riders.pb && riders.wp) addError("กรุณาเลือก PB Fit หรือ WP Fit เพียงอย่างเดียว");

  if (riders.pb) {
    if (input.age > 70) addError("PB Fit รับประกันสำหรับผู้เอาประกันภัยอายุไม่เกิน 70 ปี");
    else if (riders.payorAge < 20 || riders.payorAge > 70) addError("PB Fit กำหนดอายุผู้ชำระเบี้ย 20–70 ปี");
    else if (!riders.wp) {
      const relation = input.age <= 15 ? "parent" : "spouse";
      const prefix = input.age <= 15 ? "PBPDD" : "PBSDD";
      const key = `${prefix}${riders.payorGender}${riders.payorAge}`;
      const rawRate = riderRateData.pb[relation][key];
      if (rawRate === undefined) addError("ไม่พบอัตรา PB Fit สำหรับข้อมูลผู้ชำระเบี้ยที่เลือก");
      else {
        const waiverBase = floorTo(premiumRate * floorTo(Math.min(input.sumAssured, 30_000_000) / 1000, 3), 2);
        const rate = roundTo(rawRate * riders.pbMultiplier, 2);
        const annual = floorTo(rate * floorTo(waiverBase / 100, 3), 2);
        addRider("PB Fit", "สัญญาเพิ่มเติมพีบี ฟิต", `คุ้มครองผู้ชำระเบี้ย อายุ ${riders.payorAge} ปี`, annual);
      }
    }
  }

  if (riders.wp) {
    if (input.age < 16 || input.age > 70) addError("WP Fit รับประกันสำหรับผู้เอาประกันภัยอายุ 16–70 ปี");
    else if (!riders.pb) {
      const key = `WPTPD${input.gender}${input.age}`;
      const rawRate = riderRateData.wp[input.gender][key];
      if (rawRate === undefined) addError("ไม่พบอัตรา WP Fit สำหรับอายุที่เลือก");
      else {
        const waiverBase = floorTo(premiumRate * floorTo(Math.min(input.sumAssured, 30_000_000) / 1000, 3), 2);
        const rate = roundTo(rawRate * riders.wpMultiplier, 2);
        const annual = floorTo(rate * floorTo(waiverBase / 100, 3), 2);
        addRider("WP Fit", "สัญญาเพิ่มเติมดับบลิวพี ฟิต", "ยกเว้นเบี้ยเมื่อทุพพลภาพตามเงื่อนไข", annual);
      }
    }
  }

  const accidentMaximum = Math.min(input.age < 16 ? 3_000_000 : 10_000_000, (input.age < 16 ? 2 : 5) * input.sumAssured);
  if (riders.ap > 0) {
    if (input.age > 60) addError("AP รับประกันสำหรับอายุไม่เกิน 60 ปี");
    else if (riders.ap < 100_000 || riders.ap > accidentMaximum) addError(`ทุน AP ต้องอยู่ระหว่าง 100,000–${formatNumber(accidentMaximum)} บาท`);
    else addRider("AP", "สัญญาเพิ่มเติมอุบัติเหตุ AP", `ทุนคุ้มครอง ${formatNumber(riders.ap)} บาท`, floorTo(riderRateData.apRates[String(riders.apClass)] * riders.ap / 1000, 2));
  }

  const ecareMaximum = Math.min(10_000_000, 5 * input.sumAssured);
  if (riders.ecare > 0) {
    if (input.age < 16 || input.age > 60) addError("ECARE รับประกันสำหรับอายุ 16–60 ปี");
    else if (riders.ecare < 100_000 || riders.ecare > ecareMaximum) addError(`ทุน ECARE ต้องอยู่ระหว่าง 100,000–${formatNumber(ecareMaximum)} บาท`);
    else addRider("ECARE", "สัญญาเพิ่มเติมอุบัติเหตุ ECARE", `ทุนคุ้มครอง ${formatNumber(riders.ecare)} บาท`, floorTo(riderRateData.ecareRates[String(riders.ecareClass)] * riders.ecare / 1000, 2));
  }
  if (riders.ap + riders.ecare > Math.min(10_000_000, 5 * input.sumAssured)) addError("ทุน AP และ ECARE รวมกันเกินเกณฑ์ที่กำหนด");

  const mebOptions = input.age < 11 ? [500] : input.age < 16 ? [500, 1000] : [500, 1000, 2000, 3000, 4000, 5000];
  if (riders.meb > 0) {
    if (input.age < 6 || input.age > 65) addError("MEB รับประกันสำหรับอายุ 6–65 ปี");
    else if (!mebOptions.includes(riders.meb)) addError("ผลประโยชน์ MEB ไม่อยู่ในเกณฑ์อายุที่กำหนด");
    else {
      const base = riderRateData.meb[String(input.age)]?.[String(riders.meb)];
      if (base === undefined) addError("ไม่พบอัตรา MEB สำหรับแผนที่เลือก");
      else addRider("MEB", "สัญญาเพิ่มเติมค่ารักษาพยาบาล MEB", `ผลประโยชน์ ${formatNumber(riders.meb)} บาท`, base * occupationMultiplier(riders.mebClass));
    }
  }

  const mexOptions = input.age <= 10 ? [1200, 2200, 3200] : [1200, 2200, 3200, 4200, 6200];
  if (riders.mex > 0) {
    if (input.age > 70) addError("MEX รับประกันสำหรับอายุไม่เกิน 70 ปี");
    else if (!mexOptions.includes(riders.mex)) addError("แผน MEX ไม่อยู่ในเกณฑ์อายุที่กำหนด");
    else {
      const base = riderRateData.mex[String(input.age)]?.[`${input.gender}-${riders.mex}`];
      if (base === undefined) addError("ไม่พบอัตรา MEX สำหรับแผนที่เลือก");
      else addRider("MEX", "สัญญาเพิ่มเติมค่ารักษาพยาบาล MEX", `ค่าห้อง ${formatNumber(riders.mex)} บาท/วัน`, base * occupationMultiplier(riders.mexClass));
    }
  }

  const addLifeRider = (code: string, label: string, amount: number, minimum: number, maximum: number, ageOk: boolean, ageMessage: string, discount = 0) => {
    if (amount <= 0) return;
    if (!ageOk) addError(ageMessage);
    else if (amount < minimum || amount > maximum) addError(`ทุน ${code} ต้องอยู่ระหว่าง ${formatNumber(minimum)}–${formatNumber(maximum)} บาท`);
    else {
      const rate = riderRateData.lifeRiders[`${code}-${input.age}`]?.[input.gender];
      if (rate === undefined) addError(`ไม่พบอัตรา ${code} สำหรับอายุที่เลือก`);
      else addRider(code, label, `ทุนคุ้มครอง ${formatNumber(amount)} บาท`, floorTo((rate - discount) * amount / 1000, 2));
    }
  };

  addLifeRider("DCI", "สัญญาเพิ่มเติมโรคร้ายแรง DCI", riders.dci, 200_000, 10_000_000, input.age >= 20 && input.age <= 65, "DCI รับประกันสำหรับอายุ 20–65 ปี");
  const plsDiscount = riders.pls10 >= 1_000_000 ? 1 : riders.pls10 >= 500_000 ? 0.5 : 0;
  addLifeRider("PLS10", "สัญญาเพิ่มเติมคุ้มครองชีวิต PLS10", riders.pls10, 300_000, 5 * input.sumAssured, input.age >= 20 && input.age <= 59, "PLS10 รับประกันสำหรับอายุ 20–59 ปี", plsDiscount);
  if (riders.dci > 0 && riders.cpr > 0) addError("DCI และ CPR ไม่สามารถซื้อคู่กันได้");
  else addLifeRider("CPR", "สัญญาเพิ่มเติมโรคร้ายแรง CPR", riders.cpr, 300_000, Math.min(5_000_000, 5 * input.sumAssured), input.age <= 65, "CPR รับประกันสำหรับอายุไม่เกิน 65 ปี");

  if (riders.ihealthyPlan) {
    const allowedPlans: HealthPlan[] = input.age <= 10 ? ["SMART", "BRONZE"] : ["SMART", "BRONZE", "SILVER", "GOLD", "DIAMOND", "PLATINUM"];
    if (input.age < 6 || input.age > 80) addError("iHealthy Ultra รับประกันสำหรับอายุ 6–80 ปี");
    else if (!allowedPlans.includes(riders.ihealthyPlan)) addError("แผน iHealthy Ultra ไม่อยู่ในเกณฑ์อายุที่กำหนด");
    else if (!["DIAMOND", "PLATINUM"].includes(riders.ihealthyPlan) && riders.ihealthyRegion !== "TH") addError("แผน iHealthy Ultra ที่เลือกคุ้มครองในประเทศไทยเท่านั้น");
    else {
      const planNumber = { SMART: 1, BRONZE: 2, SILVER: 3, GOLD: 4, DIAMOND: 5, PLATINUM: 6 }[riders.ihealthyPlan];
      const coverageCode = riders.ihealthyCoverage === "deductible" ? "D" : "";
      const ageCode = input.age < 11 ? "J" : "S";
      const regionCode = riders.ihealthyRegion === "ASIA" ? "A" : riders.ihealthyRegion === "WORLD" ? "W" : "";
      const key = `MHP${coverageCode}${planNumber}${ageCode}${regionCode}-${input.gender}`;
      const base = riderRateData.ihealthy[key]?.[String(input.age)];
      if (base === undefined) addError("ไม่มีอัตรา iHealthy Ultra สำหรับชุดแผน/ความคุ้มครอง/พื้นที่ที่เลือก");
      else addRider("iHealthy Ultra", "สัญญาเพิ่มเติมสุขภาพ iHealthy Ultra", `แผน${healthPlanLabels[riders.ihealthyPlan]} · ${healthCoverageLabels[riders.ihealthyCoverage]} · ${healthRegionLabels[riders.ihealthyRegion]}`, base * occupationMultiplier(riders.ihealthyClass));
    }
  }

  if (riders.shieldPlan) {
    const allowedPlans: ShieldPlan[] = input.age <= 11 ? ["S", "M"] : ["S", "M", "L", "XL"];
    if (input.age > 65) addError("Roke Rai So Shield รับประกันสำหรับอายุไม่เกิน 65 ปี");
    else if (!allowedPlans.includes(riders.shieldPlan)) addError("แผน Roke Rai So Shield ไม่อยู่ในเกณฑ์อายุที่กำหนด");
    else {
      const planNumber = { S: 1, M: 2, L: 3, XL: 4 }[riders.shieldPlan];
      const base = riderRateData.shield[`MCI${planNumber}-${input.gender}`]?.[String(input.age)];
      if (!base) addError("ไม่พบอัตรา Roke Rai So Shield สำหรับแผนที่เลือก");
      else addRider("Roke Rai So Shield", "สัญญาเพิ่มเติมโรคร้ายแรง รอค ร้าย โซ ชิลด์", shieldPlanLabels[riders.shieldPlan], base * occupationMultiplier(riders.shieldClass));
    }
  }

  if (riders.hic > 0) {
    const hicOptions = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
    if (input.age > 65) addError("HIC รับประกันสำหรับอายุไม่เกิน 65 ปี");
    else if (!hicOptions.includes(riders.hic)) addError("ผลประโยชน์รายวัน HIC ต้องอยู่ระหว่าง 1,000–10,000 บาท");
    else if (!(riders.cpr > 0 && riders.mex > 0 && riders.meb > 0 && riders.ihealthyPlan)) addError("HIC ต้องซื้อพร้อม CPR, MEX, MEB และ iHealthy Ultra");
    else {
      const rate = riderRateData.lifeRiders[`HIC-${input.age}`]?.[input.gender];
      if (rate === undefined) addError("ไม่พบอัตรา HIC สำหรับอายุที่เลือก");
      else addRider("HIC", "สัญญาเพิ่มเติมค่าชดเชยรายวัน HIC", `ผลประโยชน์ ${formatNumber(riders.hic)} บาท/วัน`, roundTo(rate * riders.hic / 1000, 2));
    }
  }

  if (riders.ci123 > 0) {
    if (input.age > 75) addError("CI 123 รับประกันสำหรับอายุไม่เกิน 75 ปี");
    else if (riders.ci123 < 100_000 || riders.ci123 > 10_000_000) addError("ทุน CI 123 ต้องอยู่ระหว่าง 100,000–10,000,000 บาท");
    else {
      const components = [
        ["Major CI", riders.ci123],
        ["Critical Care Benefit", Math.floor(riders.ci123 * 0.25)],
        ["Juvenile CI", input.age <= 18 ? Math.floor(riders.ci123 * 0.25) : 0],
        ["Pre-Early CI", Math.floor(Math.min(riders.ci123 * 0.2, 100_000))],
        ["Early to Intermediate CI", Math.floor(riders.ci123 * 0.25)],
        ["Special Conditions", Math.floor(riders.ci123 * 0.1)],
      ] as const;
      let annual = 0;
      let modal = 0;
      for (const [component, amount] of components) {
        if (amount <= 0) continue;
        const rate = riderRateData.ci123[`${component}-${input.gender}`]?.[String(input.age)] ?? 0;
        const componentAnnual = floorTo(rate * floorTo(amount / 1000, 3), 2);
        annual += componentAnnual;
        modal += floorTo(componentAnnual * mode.factor, 2);
      }
      if (modal * mode.paymentsPerYear < 1000) addError("เบี้ยรวมรายปีของ CI 123 ต้องไม่น้อยกว่า 1,000 บาท");
      else addRider("CI 123", "สัญญาเพิ่มเติมคุ้มครองโรคร้ายแรง CI 123", `ทุนหลัก ${formatNumber(riders.ci123)} บาท พร้อมบันทึกแนบท้ายบังคับ`, annual, modal);
    }
  }

  const riderInstallmentPremium = selectedRiders.reduce((sum, rider) => sum + rider.installmentPremium, 0);
  const riderAnnualizedPremium = selectedRiders.reduce((sum, rider) => sum + rider.annualizedPremium, 0);
  const totalInstallmentPremium = installmentPremium + riderInstallmentPremium;
  const totalAnnualizedPremium = annualizedPremium + riderAnnualizedPremium;
  if (input.mode === "monthly" && totalInstallmentPremium < 1000) addError("เบี้ยประกันภัยรวมรายเดือนต้องไม่น้อยกว่า 1,000 บาท");

  let accumulatedPremium = 0;
  const rows: BenefitRow[] = [];
  for (let policyYear = 1; policyYear <= policyYears; policyYear += 1) {
    const annualPremium = policyYear <= rateData.product.premiumPaymentYears ? annualizedPremium : 0;
    accumulatedPremium += annualPremium;
    const cashValueRate = cashValueRates[String(policyYear)] ?? 0;
    const cashSurrenderValue = Math.round(cashValueRate * sumAssuredUnits);
    const deathBenefit = Math.max(input.sumAssured, accumulatedPremium * 1.01, cashSurrenderValue);
    rows.push({
      age: input.age + policyYear - 1,
      policyYear,
      annualPremium,
      accumulatedPremium,
      deathBenefit,
      cashSurrenderValue,
      isPaymentYear: policyYear <= rateData.product.premiumPaymentYears,
      isMaturity: policyYear === policyYears,
    });
  }

  const maturityBenefit = rows.at(-1)?.deathBenefit ?? input.sumAssured;
  const cashFlows = Array.from({ length: policyYears + 1 }, () => 0);
  for (let paymentIndex = 0; paymentIndex < rateData.product.premiumPaymentYears; paymentIndex += 1) cashFlows[paymentIndex] -= annualizedPremium;
  cashFlows[policyYears] += maturityBenefit;

  return {
    input,
    premiumRate,
    installmentPremium,
    annualizedPremium,
    riderInstallmentPremium,
    riderAnnualizedPremium,
    totalInstallmentPremium,
    totalAnnualizedPremium,
    totalPremium: annualizedPremium * rateData.product.premiumPaymentYears,
    maturityBenefit,
    irr: calculateIrr(cashFlows),
    selectedRiders,
    validationErrors,
    rows,
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

function searchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function ridersFromSearchParams(params: SearchParams): Partial<RiderInput> {
  return {
    pb: searchValue(params.pb) === "1",
    pbMultiplier: Number(searchValue(params.pbm)),
    payorAge: Number(searchValue(params.pba)),
    payorGender: searchValue(params.pbg) as Gender,
    wp: searchValue(params.wp) === "1",
    wpMultiplier: Number(searchValue(params.wpm)),
    meb: Number(searchValue(params.meb)),
    mebClass: Number(searchValue(params.mebc)),
    dci: Number(searchValue(params.dci)),
    pls10: Number(searchValue(params.pls)),
    ihealthyPlan: searchValue(params.ihu) as HealthPlan,
    ihealthyCoverage: searchValue(params.ihuc) as HealthCoverage,
    ihealthyRegion: searchValue(params.ihur) as HealthRegion,
    ihealthyClass: Number(searchValue(params.ihuo)),
    ci123: Number(searchValue(params.ci)),
  };
}

export function quoteInputToSearchParams(input: QuoteInput) {
  const { riders } = input;
  const query = new URLSearchParams({
    name: input.customerName,
    age: String(input.age),
    gender: input.gender,
    mode: input.mode,
    sa: String(input.sumAssured),
  });
  const set = (key: string, value: string | number) => query.set(key, String(value));
  if (riders.pb) {
    set("pb", 1); set("pbm", riders.pbMultiplier); set("pba", riders.payorAge); set("pbg", riders.payorGender);
  }
  if (riders.wp) { set("wp", 1); set("wpm", riders.wpMultiplier); }
  if (riders.meb) { set("meb", riders.meb); set("mebc", riders.mebClass); }
  if (riders.dci) set("dci", riders.dci);
  if (riders.pls10) set("pls", riders.pls10);
  if (riders.ihealthyPlan) {
    set("ihu", riders.ihealthyPlan); set("ihuc", riders.ihealthyCoverage); set("ihur", riders.ihealthyRegion); set("ihuo", riders.ihealthyClass);
  }
  if (riders.ci123) set("ci", riders.ci123);
  return query;
}

export function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("th-TH", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
