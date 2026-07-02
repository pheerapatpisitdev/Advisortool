/* ============================================================
   บำนาญ สมาร์ท 95 — Calculation Engine
   Ported from the official Excel illustration (A2026-1)
   All rate tables are in DB (db.json / embedded).
   ============================================================ */
(function (root) {
  'use strict';

  // ---- Excel-compatible rounding ----
  function rdown(x, d) { const f = Math.pow(10, d); return Math.floor((x * f) + 1e-9) / f; }
  function rup(x, d) { const f = Math.pow(10, d); return Math.ceil((x * f) - 1e-9) / f; }
  function rnd(x, d) { const f = Math.pow(10, d); return Math.round((x * f)) / f; }
  function trunc(x, d) { const f = Math.pow(10, d); return Math.trunc(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f; }

  const MODE = {
    'รายปี':       { factor: 1,    periods: 1 },
    'ราย 6 เดือน': { factor: 0.52, periods: 2 },
    'ราย 3 เดือน': { factor: 0.27, periods: 4 },
    'รายเดือน':    { factor: 0.09, periods: 12 }
  };

  // annuity benefit % of SA by ATTAINED age band (first band starts at annuityAge)
  // bands: [annuityAge..75]=15%, [76..80]=20%, [81..85]=25%, [86..95]=30%
  function annuityAnnualPct(attainedAge) {
    if (attainedAge <= 75) return 0.15;
    if (attainedAge <= 80) return 0.20;
    if (attainedAge <= 85) return 0.25;
    return 0.30;
  }
  const MONTHLY_FACTOR_FIRST = 0.0127; // used to convert desired monthly pension -> SA

  function Engine(DB) {
    this.DB = DB;
    // index plans by "annuityAge|payOption"
    this.planByKey = {};
    DB.plans.forEach(p => { this.planByKey[p.annuityStartAge + '|' + p.paymentOption] = p; });
  }

  Engine.prototype.genCode = function (g) {
    return (g === 'ชาย' || g === 'Male' || g === 'M') ? 'M' : 'F';
  };

  // ---- plan selection (กรอกข้อมูล C6 / Data Fill Parameter) ----
  Engine.prototype.selectPlan = function (annuityAge, payOption) {
    return this.planByKey[annuityAge + '|' + payOption] || null;
  };

  // premium payment years (number of premiums) for the basic plan
  Engine.prototype.payYears = function (plan, issueAge) {
    if (plan.paymentOption === 'ชำระเบี้ย 6 ปี') return 6;
    return plan.annuityStartAge - issueAge; // pay until annuity age
  };

  // ---- main rate lookup (Premium&Maturity) ----
  Engine.prototype.mainRate = function (plan, gender, age) {
    const key = plan.planCode + this.genCode(gender);
    const tbl = this.DB.main_rates[key];
    if (!tbl) return 0;
    const r = tbl[String(age)];
    return (r == null) ? 0 : r;
  };

  // main annual premium from SA
  Engine.prototype.mainAnnualFromSA = function (rate, SA) {
    return rdown(rate * rdown(SA / 1000, 3), 2);
  };

  // ---- resolve SA + premium given input type ----
  Engine.prototype.resolveMain = function (inp) {
    const plan = this.selectPlan(inp.annuityAge, inp.payOption);
    if (!plan) return { error: 'ไม่พบแบบประกันที่ตรงเงื่อนไข' };
    const gcode = this.genCode(inp.gender);
    const rate = this.mainRate(plan, inp.gender, inp.age);
    const mode = MODE[inp.mode || 'รายปี'];
    const factor = mode.factor;

    let SA;
    if (inp.inputType === 'จำนวนเงินเอาประกันภัย') {
      SA = inp.amount;
    } else if (inp.inputType === 'เบี้ยประกันภัย') {
      // C17 = ROUNDUP(premInput / rate * 1000 / modeFactor, 0)
      SA = rate > 0 ? rup(inp.amount / rate * 1000 / factor, 0) : 0;
    } else { // เงินบำนาญรายเดือน
      // C20 = ROUNDUP(pension / 0.0127, 0)
      SA = rup(inp.amount / MONTHLY_FACTOR_FIRST, 0);
    }

    const annual = this.mainAnnualFromSA(rate, SA);
    const modePrem = rdown(annual * factor, 2);
    const years = this.payYears(plan, inp.age);

    return {
      plan, rate, SA,
      gender: gcode,
      annualPremium: annual,
      modePremium: modePrem,
      payYears: years,
      mode: inp.mode || 'รายปี',
      modeFactor: factor,
      periodsPerYear: mode.periods
    };
  };

  // ============ RIDERS ============
  // Each returns { code, label, annual, mode, note, eligible }
  // base = main resolve result

  // occupation factor (occ class 4 -> x1.5 for some riders)
  function occ15(occClass) { return (occClass === 4 || occClass === '4') ? 1.5 : 1; }

  // PB — Payor Benefit (Fit/Beyond). variant: 'Fit'|'Beyond', payor age/gender
  Engine.prototype.riderPB = function (base, opt) {
    if (!opt || !opt.buy) return null;
    const insAge = base.__age;
    // parent if insured<=15 else spouse; this product issueAge>=20 -> spouse
    const isParent = insAge <= 15;
    const plancode = (isParent ? (opt.variant === 'Beyond' ? 'PBPDC' : 'PBPDD')
                               : (opt.variant === 'Beyond' ? 'PBSDDCI' : 'PBSDD'));
    const pg = this.genCode(opt.payorGender);
    const key = plancode + pg + opt.payorAge;
    const tbl = this.DB.rate_pb[key];
    // waive period: parent -> min(years, 25-insAge); spouse -> years
    const period = isParent ? Math.min(base.payYears, 25 - insAge) : base.payYears;
    if (!tbl || tbl[String(period)] == null) return { code: 'PB', label: 'PB ' + opt.variant, annual: 0, mode: 0, eligible: false, note: 'ไม่อยู่ในเกณฑ์' };
    const rate = tbl[String(period)];
    const C14 = this.pbBase(base); // main premium capped at 30M SA
    const annual = trunc(rate * trunc(C14 / 100, 3), 2);
    const modeP = trunc(annual * base.modeFactor, 2);
    return { code: 'PB', label: 'PB ' + opt.variant, rate, annual, mode: modeP, eligible: true };
  };
  // base premium for PB/WP = annual main premium computed on min(SA,30M)
  Engine.prototype.pbBase = function (base) {
    const cappedSA = Math.min(base.SA, 30000000);
    return rdown(base.rate * rdown(cappedSA / 1000, 3), 2);
  };

  // WP — Waiver of Premium (Fit/Beyond) on the insured
  Engine.prototype.riderWP = function (base, opt) {
    if (!opt || !opt.buy) return null;
    const plancode = (opt.variant === 'Beyond') ? 'WPTPDCI' : 'WPTPD';
    const key = plancode + base.gender + base.__age;
    const tbl = this.DB.rate_wp[key];
    const period = base.payYears;
    if (!tbl || tbl[String(period)] == null) return { code: 'WP', label: 'WP ' + opt.variant, annual: 0, mode: 0, eligible: false, note: 'ไม่อยู่ในเกณฑ์' };
    const rate = tbl[String(period)];
    const C15 = this.pbBase(base);
    const annual = trunc(rate * trunc(C15 / 100, 3), 2);
    const modeP = trunc(annual * base.modeFactor, 2);
    return { code: 'WP', label: 'WP ' + opt.variant, rate, annual, mode: modeP, eligible: true };
  };

  // AP — accident (per occ class), SA-based
  Engine.prototype.riderAP = function (base, opt) {
    if (!opt || !opt.sa) return null;
    const occ = opt.occ || 1;
    const rate = this.DB.rate_ap_ecare[String(occ)].AP;
    const annual = rdown(rate * opt.sa / 1000, 2);
    return { code: 'AP', label: 'AP (อุบัติเหตุ)', rate, annual, mode: rdown(annual * base.modeFactor, 2), eligible: true };
  };
  // ECARE — accident extra
  Engine.prototype.riderECARE = function (base, opt) {
    if (!opt || !opt.sa) return null;
    const occ = opt.occ || 1;
    const rate = this.DB.rate_ap_ecare[String(occ)].ECARE;
    const annual = rdown(rate * opt.sa / 1000, 2);
    return { code: 'ECARE', label: 'E-CARE (อุบัติเหตุ)', rate, annual, mode: rdown(annual * base.modeFactor, 2), eligible: true };
  };

  // MEB — daily hospital benefit (flat annual by age & plan)
  Engine.prototype.riderMEB = function (base, opt) {
    if (!opt || !opt.plan) return null;
    const tbl = this.DB.rate_meb.rates[String(base.__age)];
    if (!tbl) return { code: 'MEB', label: 'MEB', annual: 0, mode: 0, eligible: false };
    let annual = tbl[String(opt.plan)] || 0;
    annual = annual * occ15(opt.occ);
    return { code: 'MEB', label: 'MEB ' + opt.plan, annual, mode: rdown(annual * base.modeFactor, 2), eligible: annual > 0 };
  };

  // DCI — disease critical illness (rate per 1000 SA by plan&age, gender)
  Engine.prototype.riderDCI = function (base, opt) {
    if (!opt || !opt.sa) return null;
    const key = 'DCI-' + base.__age;
    const row = this.DB.rate_dci_pls[key];
    if (!row) return { code: 'DCI', label: 'DCI', annual: 0, mode: 0, eligible: false };
    const rate = row[base.gender];
    const annual = rdown(rate * opt.sa / 1000, 2);
    return { code: 'DCI', label: 'DCI (โรคร้ายแรง)', rate, annual, mode: rdown(annual * base.modeFactor, 2), eligible: true };
  };

  // PLS — term life (PLS05/10/12/15) rate per 1000 SA + discount
  Engine.prototype.riderPLS = function (base, opt) {
    if (!opt || !opt.sa) return null;
    const code = opt.code || 'PLS10';
    const key = code + '-' + base.__age;
    const row = this.DB.rate_dci_pls[key];
    if (!row) return { code: code, label: code, annual: 0, mode: 0, eligible: false };
    const rate = row[base.gender];
    // discount F21: if SA>=1,000,000 ->1 ; >=500,000 ->0.5 ; else 0
    const disc = opt.sa >= 1000000 ? 1 : (opt.sa >= 500000 ? 0.5 : 0);
    const annual = rdown(((rate - disc) * opt.sa) / 1000, 2);
    return { code: code, label: code + ' (คุ้มครองชีวิต)', rate, annual, mode: rdown(annual * base.modeFactor, 2), eligible: true };
  };

  // MEX — medical expense (flat annual by age, gender-plan)
  Engine.prototype.riderMEX = function (base, opt) {
    if (!opt || !opt.plan) return null;
    const tbl = this.DB.rate_mex.rates[String(base.__age)];
    if (!tbl) return { code: 'MEX', label: 'MEX', annual: 0, mode: 0, eligible: false };
    const colKey = base.gender + '-' + opt.plan; // e.g. M-1200
    let annual = tbl[colKey] || 0;
    annual = annual * occ15(opt.occ);
    return { code: 'MEX', label: 'MEX ' + opt.plan + ' (ค่ารักษา)', annual, mode: rdown(annual * base.modeFactor, 2), eligible: annual > 0 };
  };

  // CPR — cancer (rate per 1000 SA)
  Engine.prototype.riderCPR = function (base, opt) {
    if (!opt || !opt.sa) return null;
    const key = 'CPR-' + base.__age;
    const row = this.DB.rate_cancer.CPR[key];
    if (!row) return { code: 'CPR', label: 'CPR', annual: 0, mode: 0, eligible: false };
    const rate = row[base.gender];
    const annual = rdown(rate * opt.sa / 1000, 2);
    return { code: 'CPR', label: 'CPR (มะเร็ง)', rate, annual, mode: rdown(annual * base.modeFactor, 2), eligible: true };
  };
  // HIC — cancer hospital income (rate per 1000)
  Engine.prototype.riderHIC = function (base, opt) {
    if (!opt || !opt.sa) return null;
    const key = 'HIC-' + base.__age;
    const row = this.DB.rate_cancer.HIC[key];
    if (!row) return { code: 'HIC', label: 'HIC', annual: 0, mode: 0, eligible: false };
    const rate = row[base.gender];
    const annual = rnd(rate * opt.sa / 1000, 2);
    return { code: 'HIC', label: 'HIC (ชดเชยมะเร็ง)', rate, annual, mode: rdown(annual * base.modeFactor, 2), eligible: true };
  };

  // iHealthy Ultra (MHP) — flat annual premium by key & age
  // plan: SMART/BRONZE/SILVER/GOLD/DIAMOND/PLATINUM ; area: ประเทศไทย/เอเชีย/ทั่วโลก ; coverage: Full/Deductible/Co-Payment
  const MHP_PLAN_NUM = { SMART: 1, BRONZE: 2, SILVER: 3, GOLD: 4, DIAMOND: 5, PLATINUM: 6 };
  Engine.prototype.riderMHP = function (base, opt) {
    if (!opt || !opt.plan) return null;
    const num = MHP_PLAN_NUM[String(opt.plan).toUpperCase()];
    if (!num) return null;
    const ageClass = base.__age < 11 ? 'J' : 'S';
    const areaCode = opt.area === 'เอเชีย' ? 'A' : (opt.area === 'ทั่วโลก' ? 'W' : '');
    const covCode = opt.coverage === 'Deductible' ? 'D' : (opt.coverage === 'Co-Payment' ? 'C' : '');
    const planKey = ('MHP' + covCode + num + ageClass + areaCode).trim();
    const fullKey = planKey + '-' + base.gender;
    const tbl = this.DB.rate_ihealthy[fullKey];
    if (!tbl) return { code: 'MHP', label: 'iHealthy Ultra ' + opt.plan, annual: 0, mode: 0, eligible: false, note: 'แผน/พื้นที่ไม่ถูกต้อง' };
    let annual = tbl[String(base.__age)];
    if (annual == null) return { code: 'MHP', label: 'iHealthy Ultra ' + opt.plan, annual: 0, mode: 0, eligible: false };
    annual = annual * occ15(opt.occ);
    return { code: 'MHP', label: 'iHealthy Ultra (' + opt.plan + ')', annual, mode: rdown(annual * base.modeFactor, 2), eligible: annual > 0 };
  };

  // MCI — Roke Rai So Shield (cancer/CI) plan S/M/L/XL -> 1/2/3/4
  const MCI_PLAN_NUM = { S: 1, M: 2, L: 3, XL: 4 };
  Engine.prototype.riderMCI = function (base, opt) {
    if (!opt || !opt.plan) return null;
    const num = MCI_PLAN_NUM[String(opt.plan).toUpperCase()];
    if (!num) return null;
    const key = 'MCI' + num + '-' + base.gender;
    const tbl = this.DB.rate_mci[key];
    if (!tbl) return { code: 'MCI', label: 'โรคร้ายโซชิลด์', annual: 0, mode: 0, eligible: false };
    let annual = tbl[String(base.__age)];
    if (annual == null) return { code: 'MCI', label: 'โรคร้ายโซชิลด์', annual: 0, mode: 0, eligible: false };
    annual = annual * occ15(opt.occ);
    return { code: 'MCI', label: 'โรคร้ายโซชิลด์ (แผน ' + opt.plan + ')', annual, mode: rdown(annual * base.modeFactor, 2), eligible: annual > 0 };
  };

  // ============ ANNUITY BENEFIT SCHEDULE ============
  Engine.prototype.annuitySchedule = function (base) {
    const SA = base.SA, annuityAge = base.plan.annuityStartAge, issueAge = base.__age;
    const rows = [];
    for (let age = annuityAge; age <= 95; age++) {
      const pct = annuityAnnualPct(age);
      rows.push({ age, policyYear: age - issueAge + 1, annualPension: Math.round(SA * pct), pct });
    }
    return rows;
  };

  // ============ FULL ANNUAL ILLUSTRATION (matches Excel ตารางผลประโยชน์รายปี) ============
  Engine.prototype.illustration = function (base) {
    const SA = base.SA, plan = base.plan;
    const issueAge = base.__age, annuityAge = plan.annuityStartAge;
    const gcode = base.gender;
    const cvKey = plan.planCode + gcode + issueAge;
    const cvArr = this.DB.cv[cvKey] || [];
    const annualPrem = base.annualPremium;
    const years = base.payYears;
    const rows = [];
    let cumPrem = 0, cumPension = 0;
    for (let age = issueAge; age <= 95; age++) {
      const polYear = age - issueAge + 1;
      const prem = (polYear <= years && age < annuityAge) ? annualPrem : 0;
      cumPrem += prem;
      // cash surrender value (per 1000 SA) at end of policy year; 0 once annuity starts
      let cv = 0;
      if (age < annuityAge) {
        const f = cvArr[polYear] != null ? cvArr[polYear] : 0; // CV Year = polYear index
        cv = Math.round(f * SA / 1000);
      }
      // annuity payment at start of year (if in annuity period)
      const pension = (age >= annuityAge) ? Math.round(SA * annuityAnnualPct(age)) : 0;
      cumPension += pension;
      // death benefit
      let death;
      if (age < annuityAge) {
        // before annuity: years 1-2 = max(100% premiums, CV); year 3+ = max(110% premiums, CV)
        const f = (polYear <= 2) ? 1.0 : 1.1;
        death = Math.max(f * cumPrem, cv);
      } else {
        // during annuity: guaranteed 15 annual payouts -> PV of remaining guaranteed annuity,
        // otherwise max(0, totalPrem - totalPension)
        const pvKey = plan.planCode + age;
        const pvFactor = this.DB.pv_annual[pvKey] || 0;
        const pvRemain = Math.round(pvFactor * SA / 1000);
        const premMinusPension = Math.max(cumPrem - cumPension, 0);
        if (age < annuityAge + 14) death = Math.max(pvRemain, premMinusPension);
        else death = premMinusPension;
      }
      rows.push({ age, policyYear: polYear, premium: prem, cumPremium: cumPrem,
                  cashValue: cv, pension, cumPension, deathBenefit: death });
    }
    return rows;
  };

  // simple IRR (annual) on net cashflow at survival to maturity (age95)
  Engine.prototype.irr = function (base) {
    const rows = this.illustration(base);
    // cashflow: -premium at start of each pay year; +pension at start of annuity years
    const cf = [];
    rows.forEach(r => { cf.push((r.pension || 0) - (r.premium || 0)); });
    // Newton/bisection
    function npv(rate) { let s = 0; for (let t = 0; t < cf.length; t++) s += cf[t] / Math.pow(1 + rate, t); return s; }
    let lo = -0.9, hi = 1.0;
    if (npv(lo) * npv(hi) > 0) return null;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; const v = npv(mid); if (Math.abs(v) < 1e-4) return mid; if (npv(lo) * v < 0) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  };

  // ============ TAX DEDUCTION OPTIMIZER (คำนวณภาษี) ============
  // returns max additional annuity premium for tax + tax benefit
  Engine.prototype.tax = function (t) {
    const F14 = t.income || 0;          // assessable income
    const F20 = (t.pvd || 0) + (t.gpf || 0) + (t.teacher || 0) + (t.rmf || 0); // retirement bucket (existing)
    const F21 = t.existingOrdinaryLife || 0;
    const F22 = t.existingAnnuity || 0;
    const rate = t.marginalRate || 0;

    const G21 = Math.min(F21, 100000);
    const annCap = Math.min(0.15 * F14, 200000); // F26
    const H21 = annCap > F22 ? F22 : annCap;
    let G22;
    if (G21 < 100000 && H21 < F22 && (F22 - H21) <= (100000 - G21)) G22 = F22;
    else if ((F22 - H21) > (100000 - G21)) G22 = (100000 - G21) + H21;
    else G22 = H21;
    const F24 = G21 < 100000 ? (100000 - G21) : 0;
    const F25 = G21 < 100000 ? Math.max(0, G22 - F24) : G22;
    const F26 = annCap;
    let F27;
    if (F20 >= 500000) F27 = Math.max(F24 - G22, 0);
    else F27 = Math.max(0, Math.min(F26, 500000 - F20) - F25 - (F22 - F25 - F24));
    const F28 = Math.min(500000 - (F20 + F25), F27);
    const F29 = F27;
    const F33 = F29 * rate;
    let note = '';
    if (F20 >= 500000 && F21 >= 100000) note = 'กองทุนเพื่อการเกษียณเกิน 500,000 บาท ทำให้ไม่สามารถซื้อเบี้ยบำนาญเพิ่มเพื่อลดหย่อนได้';
    else if (F21 < 100000) note = 'สามารถซื้อแบบบำนาญลดหย่อนในส่วน 100,000 บาทแรกได้ และส่วนที่เหลือลดหย่อนในวงเงินบำนาญตามเกณฑ์สรรพากร';
    return { maxAnnuityPremium: F29, maxWithinCap: F28, taxBenefit: F33,
             ordinaryLifeUsed: G21, annuityCap: annCap, note };
  };

  // ============ TOP-LEVEL: compute everything ============
  Engine.prototype.compute = function (input) {
    const base = this.resolveMain(input);
    if (base.error) return base;
    base.__age = input.age;
    base.__gender = input.gender;

    const riders = [];
    const R = input.riders || {};
    const ctx = { age: input.age, riders: R };
    const self = this;
    const push = (code, r) => {
      if (!r) return;
      // apply age-range & cross-rider eligibility rules
      const el = self.riderEligibility(code, ctx);
      if (!el.ok) { r.eligible = false; r.annual = 0; r.mode = 0; r.note = el.msg; }
      riders.push(r);
    };
    push('pb', this.riderPB(base, R.pb));
    push('wp', this.riderWP(base, R.wp));
    push('ap', this.riderAP(base, R.ap));
    push('ecare', this.riderECARE(base, R.ecare));
    push('meb', this.riderMEB(base, R.meb));
    push('mex', this.riderMEX(base, R.mex));
    push('dci', this.riderDCI(base, R.dci));
    push('pls', this.riderPLS(base, R.pls));
    push('cpr', this.riderCPR(base, R.cpr));
    push('hic', this.riderHIC(base, R.hic));
    push('mhp', this.riderMHP(base, R.mhp));
    push('mci', this.riderMCI(base, R.mci));

    const riderModeTotal = riders.reduce((s, r) => s + (r.eligible ? r.mode : 0), 0);
    const riderAnnualTotal = riders.reduce((s, r) => s + (r.eligible ? r.annual : 0), 0);
    const totalMode = rnd(base.modePremium + riderModeTotal, 2);
    const totalAnnual = rnd(base.annualPremium + riderAnnualTotal, 2);

    return {
      base, riders,
      riderModeTotal: rnd(riderModeTotal, 2),
      riderAnnualTotal: rnd(riderAnnualTotal, 2),
      totalModePremium: totalMode,
      totalAnnualPremium: totalAnnual,
      annuitySchedule: this.annuitySchedule(base),
      illustration: this.illustration(base),
      irr: this.irr(base)
    };
  };

  // ---- which annuity-age plans are valid for a given issue age & pay option ----
  Engine.prototype.availablePlans = function (age, payOption) {
    return this.DB.plans
      .filter(p => p.paymentOption === payOption && age >= p.issueAgeMin && age <= p.issueAgeMax)
      .map(p => ({ annuityAge: p.annuityStartAge, planCode: p.planCode, name: p.productName,
                   issueAgeMin: p.issueAgeMin, issueAgeMax: p.issueAgeMax, payYear: p.paymentYear }));
  };

  // ---- rider eligibility (age ranges + cross rules). returns {ok, msg} ----
  Engine.prototype.riderEligibility = function (code, ctx) {
    const a = ctx.age;          // insured age
    const R = ctx.riders || {};
    const has = c => R[c] && R[c].buy !== false && (R[c].sa || R[c].plan || R[c].buy);
    const between = (lo, hi) => a >= lo && a <= hi;
    switch (code) {
      case 'pb': {
        const pa = R.pb && R.pb.payorAge;
        if (R.wp && (R.wp.buy)) return { ok: false, msg: 'เลือก WP หรือ PB อย่างใดอย่างหนึ่ง' };
        if (pa == null || pa < 20 || pa > 70) return { ok: false, msg: 'อายุผู้ชำระเบี้ยต้องอยู่ระหว่าง 20–70 ปี' };
        return { ok: true, msg: 'อายุผู้ชำระเบี้ย 20–70 ปี' };
      }
      case 'wp2': return { ok: true, msg: '' };
      case 'wp':
        if (!between(16, 70)) return { ok: false, msg: 'อายุ 16–70 ปี' };
        if (R.pb && R.pb.buy) return { ok: false, msg: 'เลือก WP หรือ PB อย่างใดอย่างหนึ่ง' };
        return { ok: true, msg: 'อายุ 16–70 ปี' };
      case 'ap': return { ok: between(0, 60), msg: '1 เดือน–60 ปี' };
      case 'ecare': return { ok: between(16, 60), msg: '16–60 ปี' };
      case 'mex': return { ok: between(0, 70), msg: '1 เดือน–70 ปี' };
      case 'meb': return { ok: between(6, 65), msg: '6–65 ปี' };
      case 'dci':
        if (!between(20, 65)) return { ok: false, msg: 'อายุ 20–65 ปี' };
        if (has('cpr')) return { ok: false, msg: 'ซื้อคู่กับ CPR ไม่ได้' };
        return { ok: true, msg: '20–65 ปี' };
      case 'pls': return { ok: between(20, 59), msg: '20–59 ปี' };
      case 'cpr':
        if (!between(0, 65)) return { ok: false, msg: '1 เดือน–65 ปี' };
        if (has('dci')) return { ok: false, msg: 'ซื้อคู่กับ DCI ไม่ได้' };
        return { ok: true, msg: '1 เดือน–65 ปี' };
      case 'hic':
        if (!has('cpr')) return { ok: false, msg: 'ต้องซื้อคู่กับ CPR' };
        return { ok: between(0, 65), msg: 'ต้องซื้อคู่กับ CPR' };
      case 'mhp': return { ok: between(6, 80), msg: '6–80 ปี' };
      case 'mci': return { ok: between(0, 65), msg: '1 เดือน–65 ปี' };
      default: return { ok: true, msg: '' };
    }
  };

  // MEX plan options by age
  Engine.prototype.mexPlans = function (age) {
    return age <= 10 ? [1200, 2200, 3200] : [1200, 2200, 3200, 4200, 6200];
  };
  // MEB plan options by age
  Engine.prototype.mebPlans = function (age) {
    if (age < 6 || age > 65) return [];
    if (age <= 10) return [500];
    if (age <= 15) return [500, 1000];
    return [500, 1000, 2000, 3000, 4000, 5000];
  };
  // iHealthy plan/area validity
  Engine.prototype.mhpAreas = function (plan) {
    const p = String(plan).toUpperCase();
    return (p === 'DIAMOND' || p === 'PLATINUM') ? ['ประเทศไทย', 'เอเชีย', 'ทั่วโลก'] : ['ประเทศไทย'];
  };
  Engine.prototype.mhpPlans = function (age) {
    if (age < 6 || age > 80) return [];
    if (age <= 10) return ['SMART', 'BRONZE'];
    return ['SMART', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'];
  };

  root.PensionEngine = Engine;
  root.PensionEngine._round = { rdown, rup, rnd, trunc };
  root.PensionEngine.MONTHLY_FACTOR_FIRST = MONTHLY_FACTOR_FIRST;

})(typeof module !== 'undefined' ? module.exports : window);
