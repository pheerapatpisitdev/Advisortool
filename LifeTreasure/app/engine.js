/* ============================================================
 * เอนจินคำนวณเบี้ยประกัน ไลฟ์เทรเชอร์ (A2026-1)
 * จำลองสูตรจากชีต Cal / กรอกข้อมูล / ตารางแสดงผลประโยชน์ แบบตรงเป๊ะ
 * ใช้ได้ทั้ง browser (window.LifeEngine) และ Node (module.exports)
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LifeEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- ฟังก์ชันปัดเศษแบบ Excel ----------
  // Excel ทำงานบน double 64-bit แต่แสดง/ตัดที่ 15 หลักสำคัญ
  function p15(x) { return parseFloat(Number(x).toPrecision(15)); }
  // ROUNDDOWN / TRUNC (ตัดทิ้งเข้าหาศูนย์)
  function rdown(x, n) {
    const f = Math.pow(10, n);
    const y = p15(p15(x) * f);
    return (y < 0 ? Math.ceil(y) : Math.floor(y)) / f;
  }
  // ROUND (ครึ่งปัดออกจากศูนย์)
  function rnd(x, n) {
    const f = Math.pow(10, n);
    const y = p15(p15(x) * f);
    return (y < 0 ? -Math.round(-y) : Math.round(y)) / f;
  }

  const ERR = {
    SA_INVALID: 'ระบุจำนวนเงินเอาประกันภัยไม่ถูกต้อง',
    REDUCE_30M: 'กรุณาลดทุนประกันเหลือ 30 ลบ.',
    PICK_ONE: 'กรุณาเลือก WP หรือ PB อย่างใดอย่างหนึ่ง',
    CANT_BUY: 'ไม่สามารถซื้อได้',
    PAYOR_AGE_REQ: 'กรอกอายุผู้ชำระเบี้ย',
    PAYOR_AGE_RANGE: 'อายุผู้ชำระเบี้ยไม่อยู่ในเกณฑ์',
    PAYOR_SEX_REQ: 'กรอกเพศผู้ชำระเบี้ย',
    AP_EC_OVER: 'AP+ECARE เกินกว่าที่กำหนด',
    DCI_CPR_OVER: 'DCI+CPR เกินกว่าที่กำหนด',
    CI_MIN: 'เบี้ยประกันภัยรวมรายปีของสัญญาเพิ่มเติมคุ้มครองโรคร้ายแรงและบันทึกฯต้องมากกว่าหรือเท่ากับ 1,000 บาท',
    CI_AGE: 'อายุผู้เอาประกันไม่ถูกต้อง',
    MONTHLY_MIN: 'เบี้ยรายเดือนน้อยกว่า 1,000 บาท',
  };

  const IHU_PLAN_NUM = { PLATINUM: 6, DIAMOND: 5, GOLD: 4, SILVER: 3, BRONZE: 2, SMART: 1 };
  const IHU_PLAN_TH = { PLATINUM: 'แพลทินั่ม', DIAMOND: 'ไดมอนด์', GOLD: 'โกลด์', SILVER: 'ซิลเวอร์', BRONZE: 'บรอนซ์', SMART: 'สมาร์ท' };
  const ROKE_PLAN_NUM = { 'แผน S': 1, 'แผน M': 2, 'แผน L': 3, 'แผน XL': 4 };
  const AREA_LETTER = { 'เอเชีย': 'A', 'ทั่วโลก': 'W', 'ประเทศไทย': '' };

  // ค่าว่าง/ไม่ซื้อ
  function noBuy(v) { return v === '' || v === null || v === undefined || v === 'ไม่ซื้อ'; }
  function numOr0(v) { const n = Number(v); return isFinite(n) ? n : 0; }

  /**
   * คำนวณทั้งหมด
   * @param {object} inp  ข้อมูลกรอก
   * @param {object} R    rates.json
   */
  function calc(inp, R) {
    const out = { items: [], warnings: [] };
    const g = (inp.gender === 'ชาย') ? 'M' : 'F';
    const pg = (inp.payorGender === 'ชาย') ? 'M' : (inp.payorGender === 'หญิง' ? 'F' : '');
    const mode = R.meta.modes[inp.mode];
    if (!mode) throw new Error('ไม่รู้จักงวดชำระ: ' + inp.mode);
    const factor = mode.factor, perYear = mode.perYear;
    const plan = R.meta.plans[inp.plan];
    if (!plan) throw new Error('ไม่รู้จักแบบประกัน: ' + inp.plan);
    const term = plan.term, tk = plan.key;
    const age = numOr0(inp.age), payorAge = numOr0(inp.payorAge);
    const sa = numOr0(inp.sa);

    // ---------- แบบหลัก (Cal!13, กรอกข้อมูล!F19) ----------
    const mainRateRow = R.main[tk + g] || [];
    const mainRate = (age >= 0 && age <= 80) ? mainRateRow[age] : null;
    const tiers = R.highSaDiscount.tiers;
    let tierIdx = -1;
    for (let i = tiers.length - 1; i >= 0; i--) { if (sa >= tiers[i]) { tierIdx = i; break; } }
    const disc = tierIdx >= 0 ? R.highSaDiscount[tk][tierIdx] : 0;
    const mainAnn = (mainRate == null) ? 0 : rdown((mainRate - disc) * rdown(sa / 1000, 3), 2);
    const mainModeP = rdown(mainAnn * factor, 2);
    // เบี้ยรายปีฐานสำหรับ PB/WP (ทุนไม่เกิน 30 ล้าน) = Cal!I13
    const annForWP = (mainRate == null) ? 0 : rdown((mainRate - disc) * rdown(Math.min(sa, 30000000) / 1000, 3), 2);

    let mainStatus = '', mainPrem = mainModeP;
    if (sa === 0) { mainPrem = 0; }
    else if (sa < 10000000) { mainStatus = ERR.SA_INVALID; mainPrem = null; }
    else if (mainRate == null) { mainStatus = ERR.SA_INVALID; mainPrem = null; }
    const mainCovered = !(mainPrem === 0 || mainStatus);
    out.main = {
      label: 'ไลฟ์เทรเชอร์ (' + plan.code + ')', code: plan.code, sa: mainCovered ? sa : 0,
      rate: mainRate, discount: disc, annual: mainAnn, premium: mainPrem, status: mainStatus,
      covered: mainCovered, annualized: mainCovered ? p15(mainModeP * perYear) : 0,
    };

    // ---------- PB (Cal!14, F20) ----------
    const pbBuy = inp.pbBuy === 'ซื้อ';
    const pbVariant = inp.pbVariant || 'PB Beyond';
    const pbPlancode = age <= 15
      ? (pbVariant === 'PB Fit' ? 'PBPDD' : 'PBPDDCI')
      : (pbVariant === 'PB Fit' ? 'PBSDD' : 'PBSDDCI');
    const pbW = age <= 15 ? Math.min(term, 25 - age) : term;
    let pbB20 = '';
    if (age > 70) pbB20 = ERR.CANT_BUY;
    else if (!pbBuy && noBuy(inp.pbBuy)) pbB20 = '';
    else if (age <= 70 && payorAge === 0 && pbBuy) pbB20 = ERR.PAYOR_AGE_REQ;
    else if (pbBuy && (payorAge < 20 || payorAge > 70)) pbB20 = ERR.PAYOR_AGE_RANGE;
    else if (age <= 70 && pg === '' && pbBuy) pbB20 = ERR.PAYOR_SEX_REQ;
    const pbKey = pbPlancode + pg + payorAge;
    const pbMult = numOr0(inp.pbMult) || 1;
    let pbRateD14 = 0;
    if (!(noBuy(inp.pbBuy) || pbB20 === ERR.CANT_BUY || pbB20 === ERR.PAYOR_AGE_REQ || pbB20 === ERR.PAYOR_SEX_REQ)) {
      const r = (R.pb[pbKey] || {})[String(pbW)];
      pbRateD14 = (r == null) ? null : rnd(r * pbMult, 2); // null = #N/A
    }
    const pbSA = pbBuy ? annForWP : 0;
    let pbPrem, pbStatus = '';
    if (noBuy(inp.pbBuy) || !mainCovered) { pbPrem = 0; }
    else if (mainCovered && sa > 30000000) { pbStatus = ERR.REDUCE_30M; pbPrem = null; }
    else if (age >= 16 && payorAge >= 20 && pg !== '' && inp.pbBuy === 'ซื้อ' && inp.wpBuy === 'ซื้อ') { pbStatus = ERR.PICK_ONE; pbPrem = null; }
    else if (pbRateD14 === null) { pbPrem = 0; } // IFERROR -> 0
    else {
      const G14 = rdown(pbRateD14 * rdown(pbSA / 100, 3), 2);
      pbPrem = rdown(G14 * factor, 2);
    }
    const pbCovered = !(payorAge < 20 || payorAge > 70 || noBuy(inp.pbBuy) || pbStatus !== '' || pbPrem === 0 || pbPrem === null);
    out.items.push({
      id: 'pb', label: pbVariant, plancode: pbPlancode, sa: pbSA,
      premium: pbStatus ? null : pbPrem, status: pbStatus || pbB20, covered: pbCovered,
    });

    // ---------- WP (Cal!15, F21) ----------
    const wpBuy = inp.wpBuy === 'ซื้อ';
    const wpVariant = inp.wpVariant || 'WP Fit';
    let wpB21 = (age < 16 || age > 70) ? ERR.CANT_BUY : '';
    const wpPlancode = age <= 15 ? '' : (wpVariant === 'WP Fit' ? 'WPTPD' : 'WPTPDCI');
    const wpKey = wpPlancode + g + age;
    const wpMult = numOr0(inp.wpMult) || 1;
    const wpRateRaw = (R.wp[wpKey] || {})[String(term)];
    const wpRateD15 = (wpRateRaw == null) ? 0 : rnd(wpRateRaw * wpMult, 2); // IFERROR -> 0
    const wpSA = wpBuy ? annForWP : 0;
    let wpPrem, wpStatus = '';
    if (noBuy(inp.wpBuy) || !mainCovered) { wpPrem = 0; }
    else if (mainCovered && sa > 30000000) { wpStatus = ERR.REDUCE_30M; wpPrem = null; }
    else if (age >= 16 && payorAge >= 20 && pg !== '' && inp.pbBuy === 'ซื้อ' && inp.wpBuy === 'ซื้อ') { wpStatus = ERR.PICK_ONE; wpPrem = null; }
    else {
      const G15 = rdown(wpRateD15 * rdown(wpSA / 100, 3), 2);
      wpPrem = rdown(G15 * factor, 2);
    }
    const wpCovered = !(age < 16 || age > 70 || noBuy(inp.wpBuy) || wpStatus !== '' || wpPrem === 0 || wpPrem === null);
    out.items.push({
      id: 'wp', label: wpVariant, plancode: wpPlancode, sa: wpSA,
      premium: wpStatus ? null : wpPrem, status: wpStatus || wpB21, covered: wpCovered,
    });

    // ---------- AP (Cal!16, F22) ----------
    const apSa = numOr0(inp.apSa), ecSa = numOr0(inp.ecareSa);
    const apEcLimit = Math.min(5 * sa, 10000000);
    const apMax = age < 16 ? Math.min(3000000, 2 * sa) : apEcLimit;
    const apOcc = String(numOr0(inp.apOcc) || 1);
    const apRate = age > 60 ? 0 : (R.apEcare[apOcc] || {}).AP || 0;
    let apPrem, apStatus = '';
    if (apSa + ecSa > apEcLimit) { apStatus = ERR.AP_EC_OVER; apPrem = null; }
    else if (age < 16 && apSa > apMax) { apStatus = 'AP เกินกว่าที่กำหนด'; apPrem = null; }
    else {
      const G16 = rdown(apRate * apSa / 1000, 2);
      apPrem = rdown(G16 * factor, 2);
    }
    out.items.push({
      id: 'ap', label: 'AP', sa: apSa, premium: apPrem, status: apStatus || (age > 60 ? ERR.CANT_BUY : ''),
      covered: !(apStatus || apPrem === 0),
    });

    // ---------- ECARE (Cal!17, F23) ----------
    const ecRate = (age < 16 || age > 60) ? 0 : (R.apEcare[String(numOr0(inp.ecareOcc) || 1)] || {}).ECARE || 0;
    let ecPrem, ecStatus = '';
    if (apSa + ecSa > apEcLimit) { ecStatus = ERR.AP_EC_OVER; ecPrem = null; }
    else {
      const G17 = rdown(ecRate * ecSa / 1000, 2);
      ecPrem = rdown(G17 * factor, 2);
    }
    out.items.push({
      id: 'ecare', label: 'ECARE', sa: ecSa, premium: ecPrem,
      status: ecStatus || ((age < 16 || age > 60) ? ERR.CANT_BUY : ''),
      covered: !(ecStatus || ecPrem === 0),
    });

    // ---------- MEX (Cal!22, F24) ----------
    const mexPlan = noBuy(inp.mexPlan) ? 0 : numOr0(inp.mexPlan);
    const mexMax = age > 70 ? null : (age <= 10 ? 3200 : 6200);
    const mexOccMult = numOr0(inp.mexOcc) === 4 ? 1.5 : 1;
    const mexCoveredFlag = !(mainModeP === 0 || mexPlan === 0 || (mexMax !== null && mexPlan > mexMax) || mexMax === null);
    let mexPrem, mexStatus = '';
    if (mexPlan === 0 || mainModeP === 0) { mexPrem = 0; }
    else if (mexMax === null) { mexPrem = 0; mexStatus = ERR.CANT_BUY; }
    else if (mexPlan > mexMax) { mexStatus = 'MEX เกินกว่าที่กำหนด'; mexPrem = null; }
    else {
      const mexSA = mexCoveredFlag ? mexPlan : 0;
      const arr = R.mex[g + '-' + mexPlan] || [];
      const rate = (age > 70 || mexSA === 0) ? 0 : numOr0(arr[age]);
      const G22 = p15(rate * mexOccMult);
      mexPrem = rdown(G22 * factor, 2);
    }
    out.items.push({ id: 'mex', label: 'MEX', sa: mexPlan, premium: mexPrem, status: mexStatus, covered: mexCoveredFlag && mexPrem > 0 });

    // ---------- MEB (Cal!19, F25) ----------
    const mebPlan = noBuy(inp.mebPlan) ? 0 : numOr0(inp.mebPlan);
    const mebMax = (age < 6 || age > 65) ? null : (age < 11 ? 500 : (age < 16 ? 1000 : 5000));
    const mebOccMult = numOr0(inp.mebOcc) === 4 ? 1.5 : 1;
    let mebPrem, mebStatus = '';
    if (mainModeP === 0 || mebPlan === 0) { mebPrem = 0; }
    else if (mebMax === null) { mebPrem = 0; mebStatus = ERR.CANT_BUY; }
    else if (mebPlan > mebMax) { mebStatus = 'MEB เกินกว่าที่กำหนด'; mebPrem = null; }
    else {
      const rate = numOr0((R.meb[String(age)] || {})[String(mebPlan)]);
      const G19 = p15(rate * mebOccMult);
      mebPrem = rdown(G19 * factor, 2);
    }
    out.items.push({ id: 'meb', label: 'MEB', sa: mebPlan, premium: mebPrem, status: mebStatus, covered: !(mebStatus || mebPrem === 0) });

    // ---------- DCI (Cal!20, F26) ----------
    const dciSa = numOr0(inp.dciSa), cprSa = numOr0(inp.cprSa);
    const dciAvail = age >= 20 && age <= 65;
    let dciPrem, dciStatus = '';
    if (dciAvail && dciSa > 10000000) { dciStatus = 'DCI เกินกว่าที่กำหนด'; dciPrem = null; }
    else if (dciSa + cprSa > 10000000) { dciStatus = ERR.DCI_CPR_OVER; dciPrem = null; }
    else {
      const rate = dciAvail ? numOr0((R.riderPer1000['DCI-' + age] || {})[g]) : 0;
      const G20 = rdown(rate * dciSa / 1000, 2);
      dciPrem = rdown(G20 * factor, 2);
    }
    out.items.push({
      id: 'dci', label: 'DCI', sa: dciSa, premium: dciPrem,
      status: dciStatus || (!dciAvail ? ERR.CANT_BUY : ''), covered: !(dciStatus || dciPrem === 0),
    });

    // ---------- PLS (Cal!21, F27) ----------
    const plsVariant = inp.plsVariant || 'PLS10';
    const plsSa = numOr0(inp.plsSa);
    const plsAvail = age >= 20 && age <= 59;
    let plsPrem, plsStatus = '';
    if (!plsAvail) { plsPrem = 0; plsStatus = plsSa > 0 ? ERR.CANT_BUY : ''; }
    else if (plsSa > 5 * sa) { plsStatus = plsVariant + ' เกินกว่าที่กำหนด'; plsPrem = null; }
    else {
      const rate = numOr0((R.riderPer1000[plsVariant + '-' + age] || {})[g]);
      const dsc = rate === 0 ? 0 : (plsSa >= 1000000 ? 1 : (plsSa >= 500000 ? 0.5 : 0));
      const G21 = rdown((rate - dsc) * plsSa / 1000, 2);
      plsPrem = rdown(G21 * factor, 2);
    }
    out.items.push({ id: 'pls', label: plsVariant, sa: plsSa, premium: plsPrem, status: plsStatus, covered: !(plsStatus || plsPrem === 0) });

    // ---------- CPR (Cal!37, F28) ----------
    const cprConflict = dciSa > 0;
    const cprAvail = age <= 65 && !cprConflict;
    const cprMax = cprAvail ? Math.min(5000000, sa * 5) : null;
    let cprPrem, cprStatus = '';
    if (cprMax !== null && cprSa > cprMax) { cprStatus = 'CPR เกินกว่าที่กำหนด'; cprPrem = null; }
    else if (cprSa + dciSa > 10000000) { cprStatus = ERR.DCI_CPR_OVER; cprPrem = null; }
    else {
      const rate = cprAvail ? numOr0((R.riderPer1000['CPR-' + age] || {})[g]) : 0;
      const G37 = rdown(rate * cprSa / 1000, 2);
      cprPrem = rdown(G37 * factor, 2);
    }
    const cprCovered = !(cprStatus || cprPrem === 0 || cprPrem === null || !cprAvail);
    out.items.push({
      id: 'cpr', label: 'CPR', sa: cprSa, premium: cprPrem,
      status: cprStatus || (age > 65 ? ERR.CANT_BUY : (cprConflict && cprSa > 0 ? 'ไม่สามารถซื้อคู่กับ DCI ได้' : '')),
      covered: cprCovered,
    });

    // ---------- iHealthy Ultra (Cal!23, F30) — คำนวณก่อน HIC เพราะ HIC เช็คว่าซื้อ iHU ไหม ----------
    const ihuPlan = noBuy(inp.ihuPlan) ? '' : inp.ihuPlan;
    const ihuNum = IHU_PLAN_NUM[ihuPlan] || '';
    let ihuPrem, ihuStatus = '';
    let ihuKey = '';
    if (age <= 5) { ihuStatus = 'ไม่สามารถซื้อ iHealthy Ultra ได้'; ihuPrem = null; }
    else if (ihuPlan === '') { ihuPrem = 0; }
    else if (age < 11 && ihuNum > 2) { ihuStatus = 'แผน iHealthy Ultra ไม่ถูกต้อง'; ihuPrem = null; }
    else {
      const area = inp.ihuArea || 'ประเทศไทย';
      const check =
        (age < 11 && ihuNum <= 2 && area === 'ประเทศไทย') ||
        (age >= 11 && ihuNum <= 4 && area === 'ประเทศไทย') ||
        (age >= 11 && ihuNum >= 5);
      const covL = inp.ihuCoverage === 'Deductible' ? 'D' : (inp.ihuCoverage === 'Co-Payment' ? 'C' : '');
      ihuKey = 'MHP' + covL + ihuNum + (age < 11 ? 'J' : 'S') + (AREA_LETTER[area] || '') + '-' + g;
      if (!check) { ihuPrem = 0; }
      else {
        const arr = R.ihu[ihuKey];
        const rate = arr ? arr[age] : undefined;
        if (typeof rate !== 'number') { ihuStatus = 'ไม่มีอัตราเบี้ยสำหรับแผน/พื้นที่นี้'; ihuPrem = null; }
        else {
          const G23 = p15(rate * (numOr0(inp.ihuOcc) === 4 ? 1.5 : 1));
          ihuPrem = rdown(G23 * factor, 2);
        }
      }
    }
    const ihuCovered = !(mainModeP === 0 || ihuPlan === '' || ihuPrem === 0 || ihuPrem === null);
    out.items.push({
      id: 'ihu', label: 'iHealthy Ultra', key: ihuKey,
      planTH: IHU_PLAN_TH[ihuPlan] || '', sa: 0, plan: ihuPlan,
      premium: ihuStatus ? null : ihuPrem, status: ihuStatus, covered: ihuCovered,
    });

    // ---------- MEB/MEX/iHU covered flags สำหรับ HIC ----------
    const mexCov = out.items.find(i => i.id === 'mex').covered;
    const mebCov = out.items.find(i => i.id === 'meb').covered;

    // ---------- HIC (Cal!38, F29) ----------
    const hicPlan = noBuy(inp.hicPlan) ? 0 : numOr0(inp.hicPlan);
    let hicB29 = '';
    if (hicPlan > 0) {
      if (mexCov) hicB29 = 'ไม่สามารถซื้อคู่กับ MEX';
      else if (ihuCovered) hicB29 = 'ไม่สามารถซื้อคู่กับ iHealthy Ultra';
      else if (mebCov) hicB29 = 'ไม่สามารถซื้อคู่กับ MEB';
      else if (!cprCovered) hicB29 = 'ต้องซื้อคู่กับ CPR';
    }
    const hicCovered = hicPlan > 0 && cprCovered && hicB29 === '' && age <= 65;
    const hicSA = hicCovered ? hicPlan : 0;
    const hicRate = (age <= 84) ? numOr0((R.riderPer1000['HIC-' + age] || {})[g]) : 0;
    const G38 = rnd(hicRate * hicSA / 1000, 2); // ROUND (ไม่ใช่ ROUNDDOWN) ตาม Cal!G38
    const hicPrem = rdown(G38 * factor, 2);
    out.items.push({ id: 'hic', label: 'HIC', sa: hicPlan, premium: hicPrem, status: hicB29, covered: hicCovered });

    // ---------- โรคร้ายโซชิลด์ (Cal!24, F32) ----------
    const rokePlan = inp.rokePlan || '';
    let rokePrem = 0, rokeStatus = '';
    if (rokePlan !== '') {
      const n = ROKE_PLAN_NUM[rokePlan];
      const avail = age <= 65 && (n <= 2 || age >= 11);
      if (!avail) { rokePrem = null; rokeStatus = '-'; }
      else {
        const arr = R.mci['MCI' + n + '-' + g];
        const rate = arr ? arr[age] : undefined;
        if (typeof rate !== 'number') { rokePrem = null; rokeStatus = '-'; }
        else {
          const G24 = p15(rate * (numOr0(inp.rokeOcc) === 4 ? 1.5 : 1));
          rokePrem = rdown(G24 * factor, 2);
        }
      }
    }
    out.items.push({
      id: 'roke', label: 'Roke Rai So Shield', plan: rokePlan, sa: 0,
      premium: rokePrem, status: rokeStatus === '-' ? ERR.CANT_BUY : '', covered: !(rokePrem === 0 || rokePrem === null),
    });

    // ---------- CI 123 + บันทึกแนบ (กรอกข้อมูล AN28:AN33, F33:F36) ----------
    const ciSa = numOr0(inp.ci123Sa);
    const ciComps = [
      { name: 'Major CI', sa: ciSa },
      { name: 'Critical Care Benefit', sa: p15(ciSa * 0.25) },
      { name: 'Juvenile CI', sa: p15(ciSa * 0.25), maxAge: 18 },
      { name: 'Pre-Early CI', sa: Math.min(p15(ciSa * 0.2), 100000) },
      { name: 'Early to Intermediate CI', sa: p15(ciSa * 0.25) },
      { name: 'Special Conditions', sa: p15(ciSa * 0.1) },
    ];
    let ciAN = [], ciDetail = [];
    for (const c of ciComps) {
      let rate = 0;
      if (age <= 75 && !(c.maxAge && age > c.maxAge)) {
        rate = numOr0((R.ci123[c.name + '-' + g] || {})[String(age)]);
      }
      const AM = rdown(rate * rdown(c.sa / 1000, 3), 2);
      const AN = rdown(AM * factor, 2);
      ciAN.push(AN);
      ciDetail.push({ name: c.name, sa: c.sa, rate: rate, annual: AM, premium: AN });
    }
    const ciAnnTotal = p15(ciAN.reduce((a, b) => p15(a + b), 0) * perYear);
    let ciStatus = '';
    if (ciSa > 0) {
      if (age > 75) ciStatus = ERR.CI_AGE;
      else if (ciAnnTotal < 1000) ciStatus = ERR.CI_MIN;
    }
    const ciMain = ciSa === 0 ? 0 : (ciStatus ? null : p15(ciAN[0] + ciAN[1] + ciAN[2]));
    out.items.push({
      id: 'ci123', label: 'สัญญาเพิ่มเติมคุ้มครองโรคร้ายแรง (CI 123)', sa: ciSa,
      premium: ciMain, status: ciStatus, covered: !(ciMain === 0 || ciMain === null), detail: ciDetail,
    });
    const ciMemoDefs = [
      ['ci123_pre', 'บันทึกฯ โรคร้ายแรงระยะก่อนเริ่มต้น (CI 123)', 3],
      ['ci123_ei', 'บันทึกฯ โรคร้ายแรงระยะเริ่มต้นถึงปานกลาง (CI 123)', 4],
      ['ci123_sp', 'บันทึกฯ โรคร้ายแรงภายใต้เงื่อนไขพิเศษ (CI 123)', 5],
    ];
    for (const [id, label, idx] of ciMemoDefs) {
      const prem = ciSa === 0 ? 0 : (ciStatus ? null : ciAN[idx]);
      out.items.push({
        id, label, sa: ciDetail[idx].sa, premium: prem, status: ciStatus,
        covered: !(prem === 0 || prem === null),
      });
    }

    // ---------- รวม (F37, C41) ----------
    let total = 0;
    if (mainCovered) {
      total = p15(numOr0(mainPrem) + out.items.reduce((acc, it) => p15(acc + (typeof it.premium === 'number' ? it.premium : 0)), 0));
    }
    out.totalPerPeriod = total;
    const e70no = total === 0 || (inp.mode === 'รายเดือน' && total < 1000);
    let firstPayment, firstPaymentStatus = '';
    if (inp.mode === 'รายเดือน' && total < 1000) { firstPayment = null; firstPaymentStatus = ERR.MONTHLY_MIN; }
    else firstPayment = e70no ? 0 : total;
    out.firstPayment = firstPayment;
    out.firstPaymentStatus = firstPaymentStatus;
    out.perYear = perYear;
    out.displaySa = mainCovered ? sa : 0;
    out.mainAnnualized = mainCovered && !e70no ? p15(mainModeP * perYear) : (mainCovered ? p15(mainModeP * perYear) : 0);
    if (inp.mode === 'รายเดือน') out.warnings.push('การชำระเบี้ยประกันภัยรายเดือนครั้งแรก ผู้เอาประกันภัยต้องชำระเบี้ยประกันภัยเป็นจำนวน 2 งวด');

    // ---------- ตารางแสดงผลประโยชน์ ----------
    const tab = (g === 'M' ? R.tabcvM : R.tabcvF)[tk + g + age] || [];
    const annualizedMain = p15(mainModeP * perYear); // I19
    const rows = [];
    let cum = 0;
    const years = Math.max(0, 99 - age);
    for (let y = 1; y <= years && y <= 100; y++) {
      const prem = e70no ? 0 : (y <= term ? annualizedMain : 0);
      cum = p15(cum + prem);
      const cvRate = numOr0(tab[y - 1]);
      const cv = rnd(cvRate * out.displaySa / 1000, 0);
      const death = Math.max(out.displaySa, p15(1.01 * cum), cv);
      rows.push({ year: y, age: age + y - 1, premium: prem, cumPremium: cum, cv, death });
    }
    out.illustration = rows;
    return out;
  }

  return { calc, rdown, rnd, p15, ERR };
});
