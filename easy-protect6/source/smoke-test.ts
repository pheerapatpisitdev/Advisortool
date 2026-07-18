import { calculateQuote, calculateSumAssuredFromPremium } from "./calculator";

function equal(actual: number, expected: number, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
}

const male30 = calculateQuote({ age: 30, gender: "M", mode: "annual", sumAssured: 500_000 });
equal(male30.installmentPremium, 29_750, "male 30 annual premium");
equal(male30.totalInstallmentPremium, 29_750, "male 30 total premium");
equal(male30.rows.length, 69, "male 30 benefit rows");
equal(male30.rows[0].annualPremium, 29_750, "first-year annual premium");
equal(male30.rows[5].accumulatedPremium, 178_500, "six-year accumulated premium");
equal(male30.rows[13].cashSurrenderValue - male30.rows[13].accumulatedPremium, 0, "year 14 policy gain");
equal(male30.rows[14].cashSurrenderValue - male30.rows[14].accumulatedPremium, 6_500, "year 15 policy gain");
equal(male30.rows.findIndex((row) => row.cashSurrenderValue >= row.accumulatedPremium && row.accumulatedPremium > 0), 13, "break-even row");
equal(male30.maturityBenefit, 500_000, "maturity benefit");

const reversed = calculateSumAssuredFromPremium({ age: 30, gender: "M", mode: "annual", premium: 29_750 });
equal(reversed, 500_000, "reverse calculation");

const female35 = calculateQuote({ age: 35, gender: "F", mode: "annual", sumAssured: 500_000 });
equal(female35.installmentPremium, 30_950, "female 35 annual premium");

const monthly = calculateQuote({ age: 30, gender: "M", mode: "monthly", sumAssured: 500_000 });
equal(monthly.installmentPremium, 2_677.5, "male 30 monthly premium");

console.log(JSON.stringify({
  male30Annual: male30.installmentPremium,
  reverseSumAssured: reversed,
  female35Annual: female35.installmentPremium,
  male30Monthly: monthly.installmentPremium,
  benefitRows: male30.rows.length,
  irr: male30.irr,
}, null, 2));
