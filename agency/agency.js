/* =========================================================================
 * Agency Blueprint — shared data + calculation logic (vanilla)
 * Ported 1:1 from:
 *   app/agency/_src/lib/products.ts
 *   app/agency/_src/lib/manager-test-questions.ts
 *   app/agency/_src/lib/formatters.ts
 *   app/agency/_src/ai/flows/agent-income.ts
 *   app/agency/_src/ai/flows/commission.ts
 * No server / no /api — everything computes locally in the browser.
 * ========================================================================= */

/* ---------- products.ts ---------- */
const insuranceProducts = [
  { id: 'ishield_5', name: 'iShield 5', commissionRates: [25, 10, 6.25, 3, 3, 0, 0] },
  { id: 'ishield_10', name: 'iShield 10', commissionRates: [35, 20, 10, 5, 3, 3, 1] },
  { id: 'ishield_15', name: 'iShield 15', commissionRates: [37, 25, 15, 8, 5, 3, 1] },
  { id: 'ishield_20', name: 'iShield 20', commissionRates: [40, 30, 20, 10, 5, 5, 1] },
  { id: 'term_life_plb_5_5', name: 'Term life PLB 5/5', commissionRates: [30, 16, 10, 0, 0, 0, 0] },
  { id: 'term_life_plb_10_10', name: 'Term life PLB 10/10', commissionRates: [30, 20, 10, 0, 0, 0, 0] },
  { id: 'term_life_plb_12_12', name: 'Term life PLB 12/12', commissionRates: [35, 20, 10, 0, 0, 0, 0] },
  { id: 'term_life_plb_15_15', name: 'Term life PLB 15/15', commissionRates: [35, 20, 10, 0, 0, 0, 0] },
  { id: 'life_ready_6y', name: 'Life Ready 6Y', commissionRates: [25, 10, 6.25, 5, 5, 5, 0] },
  { id: 'life_ready_12y', name: 'Life Ready 12Y', commissionRates: [30, 12, 7.5, 5, 5, 5, 5] },
  { id: 'life_ready_18y_gte_300k', name: 'Life Ready 18Y >=300k', commissionRates: [40, 16, 10, 5, 5, 5, 5] },
  { id: 'ihealthy_ultra_6_10', name: 'iHealthy Ultra - Full (6-10)', commissionRates: [90, 10, 5, 5, 5, 5, 5] },
  { id: 'ihealthy_ultra_11_80', name: 'iHealthy Ultra - Full (11-80)', commissionRates: [25, 15, 10, 5, 5, 5, 5] },
];

/* ---------- manager-test-questions.ts ---------- */
const managerTestQuestions = [
  "ฉันมีวิสัยทัศน์ พันธกิจ เป้าหมายที่ชัดเจน",
  "ตัวแทนทุกคนในหน่วยรู้จัก วิสัยทัศน์ พันธกิจ เป้าหมายของหน่วย",
  "ฉันมีปรัชญาการทำงานของหน่วย",
  "ฉันมีขั้นตอนการเกณฑ์ตัวแทนที่เป็นรูปแบบ",
  "ฉันรู้สึกสบายใจกับการเกณฑ์ตัวแทน",
  "ฉันมีแหล่งในการเกณฑ์มากพอ",
  "ฉันชัดเจนในคุณสมบัติของตัวแทนที่จะชวน และพร้อมจะคัดทิ้ง",
  "ฉันจะเอาคนล้มเหลวออกไปจากหน่วยให้เร็วที่สุด",
  "ฉันมีโปรแกรมการฝึกอบรม และการโค้ชที่เป็นรูปแบบ",
  "ตัวแทนของฉัน มีความรู้ ทัศนคติ ทักษะและ วินัย ในระดับ",
  "ฉันมีโปรแกรมการอบรมตัวแทนก่อนการออกรหัส",
  "ฉันมีโปรแกรมสำหรับตัวแทนใหม่ในการเริ่มต้นที่รวดเร็วและแข็งแกร่ง",
  "ฉันออกตลาดกับตัวแทนมากพอ",
  "ฉันทำตามขั้นตอนการออกตลาดที่เป็นรูปแบบ",
  "ฉันรู้ว่าอะไรสร้างแรงบันดาลใจให้กับตัวแทนของฉันมากที่สุด",
  "ฉันมีการ Coach ตัวแทนตามขั้นตอน และ สม่ำเสมอ",
  "ฉันใช้กิจกรรมการขายในการติดตามการทำงานของตัวแทน",
  "ฉันใช้แบบสอบถามโรคร้ายแรงและรูปแบบการใช้ชีวิตได้คล่อง",
  "ฉันชอบเวลาออกภาคสนามไปขายประกันแก่ลูกค้า",
  "ฉันเคยติดคุณวุฒิระดับสากล MDRT มาก่อนแล้ว",
  "ฉันมีจำนวนลูกค้า 300 คนขึ้นไป",
  "ฉันสามารถนำเสนอขายผลิตภัณฑ์ได้แบบน่าเชื่อถือ",
  "ธุรกิจประกันชีวิตจะเป็นสิ่งที่ฉันทำไปตลอดชีวิต",
  "ฉันมีภาวะผู้นำ ในการบริหารหน่วย",
];

/* ---------- formatters.ts ---------- */
function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ---------- ai/flows/agent-income.ts ---------- */
function getQvbRate(nbc) {
  if (nbc >= 150000) return 0.55;
  if (nbc >= 100000) return 0.50;
  if (nbc >= 75000) return 0.45;
  if (nbc >= 50000) return 0.35;
  if (nbc >= 25000) return 0.25;
  if (nbc >= 10000) return 0.12;
  return 0;
}

function getYebRate(annualNbc) {
  if (annualNbc >= 600000) return 0.1375;
  if (annualNbc >= 400000) return 0.1250;
  if (annualNbc >= 300000) return 0.1125;
  if (annualNbc >= 200000) return 0.0875;
  if (annualNbc >= 100000) return 0.0625;
  if (annualNbc >= 40000) return 0.03;
  return 0;
}

function agentIncomeCalculator(input) {
  const { ape, productId, paymentMode, persistencyModifier } = input;

  const product = insuranceProducts.find(p => p.id === productId);
  if (!product) {
    throw new Error('Invalid product selected');
  }
  const { commissionRates } = product;
  const firstYearCommissionRate = commissionRates[0];

  const commission = ape * (firstYearCommissionRate / 100);

  let modeCreditRate = 1; // for semi-annually
  if (paymentMode === 'yearly') {
    modeCreditRate = 1.05;
  } else if (paymentMode === 'monthly') {
    modeCreditRate = 0.95;
  }

  const nbc = commission * modeCreditRate;

  const qvbRate = getQvbRate(nbc);
  const quarterlyBonus = nbc * qvbRate * (persistencyModifier / 100);

  const annualNbc = commission;
  const yebRate = getYebRate(annualNbc);
  const yearlyBonus = annualNbc * yebRate * (persistencyModifier / 100);

  const actualTotalIncome = commission + quarterlyBonus + yearlyBonus;

  const commissionProjection = commissionRates.map((rate, index) => ({
    year: index + 1,
    rate: rate,
    commission: ape * (rate / 100),
  }));

  const incomeProjection = [];
  for (let projectionYear = 1; projectionYear <= 7; projectionYear++) {
    const newBusinessIncome = actualTotalIncome;

    let renewalIncome = 0;
    for (let pastBusinessYear = 1; pastBusinessYear < projectionYear; pastBusinessYear++) {
      const commissionYearIndex = projectionYear - pastBusinessYear;
      if (commissionYearIndex < commissionRates.length) {
        const renewalRate = commissionRates[commissionYearIndex];
        renewalIncome += ape * (renewalRate / 100);
      }
    }

    const totalIncome = newBusinessIncome + renewalIncome;

    incomeProjection.push({ year: projectionYear, newBusinessIncome, renewalIncome, totalIncome });
  }

  return {
    commission,
    firstYearCommissionRate,
    nbc,
    modeCreditRate,
    quarterlyBonus,
    qvbRate,
    yearlyBonus,
    yebRate,
    actualTotalIncome,
    commissionProjection,
    incomeProjection,
  };
}

/* ---------- ai/flows/commission.ts ---------- */
function getTorRate(managerTenure, persistencyRate) {
  if (managerTenure === 1) { // <= 12 months
    if (persistencyRate >= 80) return 0.35;
    if (persistencyRate >= 75) return 0.30;
    if (persistencyRate >= 65) return 0.25;
    if (persistencyRate >= 55) return 0.20;
    if (persistencyRate >= 45) return 0.15;
    return 0;
  } else { // > 12 months
    if (persistencyRate >= 95) return 0.50;
    if (persistencyRate >= 85) return 0.45;
    if (persistencyRate >= 80) return 0.35;
    if (persistencyRate >= 75) return 0.30;
    if (persistencyRate >= 65) return 0.25;
    if (persistencyRate >= 55) return 0.20;
    if (persistencyRate >= 45) return 0.15;
    return 0;
  }
}

function commissionCalculator(input) {
  let totalTor = 0;
  let totalAdor = 0;
  let totalMdor = 0;

  const detailsByLevel = { direct: undefined, child: [], grandchild: [] };

  // 1. Direct Unit
  if (input.direct && input.direct.nbc > 0) {
    const { nbc, applyAdor, managerTenure, persistencyRate } = input.direct;
    const torRate = getTorRate(managerTenure, persistencyRate);
    const tor = nbc * torRate;
    const ador = applyAdor ? tor * 0.6 : 0;
    totalTor += tor;
    totalAdor += ador;
    detailsByLevel.direct = { tor, ador };
  }

  // 2. Child Units
  if (input.child) {
    input.child.forEach(unit => {
      if (unit.nbc > 0) {
        const { nbc, unitAgeYear } = unit;
        const tor = nbc * 0.175;
        let mdor = 0;
        if (unitAgeYear === 1) {
          mdor = nbc * 0.175;
        } else if (unitAgeYear === 2) {
          mdor = nbc * 0.0875;
        }
        totalTor += tor;
        totalMdor += mdor;
        detailsByLevel.child.push({ tor, mdor });
      }
    });
  }

  // 3. Grandchild Units
  if (input.grandchild) {
    input.grandchild.forEach(unit => {
      if (unit.nbc > 0) {
        const { nbc } = unit;
        const tor = nbc * 0.035;
        totalTor += tor;
        detailsByLevel.grandchild.push({ tor });
      }
    });
  }

  const monthlyIncome = totalTor + totalAdor + totalMdor;
  const quarterlyBonus = 0;
  const totalAnnualIncome = monthlyIncome * 12;

  return {
    breakdown: { tor: totalTor, ador: totalAdor, mdor: totalMdor },
    monthlyIncome,
    quarterlyBonus,
    totalAnnualIncome,
    detailsByLevel,
  };
}
