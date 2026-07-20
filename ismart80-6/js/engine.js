// =====================================================================
// iSmart 80/6 (W80F06) premium + benefit engine — validated 1:1 vs the
// source workbook (ไอสมาร์ท 80-6_A2026-1.xlsx) via scripts/validate.mjs.
// Rider rate ecosystem is shared with LifeReady (same A2026-1 sheets); the
// rider math here is ported from the validated lifeready engine. The MAIN
// plan, the annual cash-back benefit table, and cash surrender are W80F06.
// Do NOT change rounding/lookups without re-running the harness.
// =====================================================================
window.IS80 = (function () {
  function rd(x, n) { if (x < 0) return -rd(-x, n); var p = Math.pow(10, n); return Math.floor(x * p + 1e-7) / p; } // ROUNDDOWN/TRUNC
  function rnd(x, n) { var p = Math.pow(10, n); return Math.round(x * p) / p; }                                       // ROUND half-up
  function round0(x) { return Math.round(x); }

  function genderLetter(sexTH) { return (sexTH === 'ชาย' || sexTH === 'M' || sexTH === 'Male') ? 'M' : 'F'; }
  function modeObj(D, modeTH) { for (var i = 0; i < D.modes.length; i++) if (D.modes[i].th === modeTH) return D.modes[i]; return D.modes[0]; }
  function occMul(occ) { return (occ === 4 || occ === '4') ? 1.5 : 1; }

  var PAY_YEAR = 6, COVER_AGE = 80, ISSUE_MIN = 25, ISSUE_MAX = 65;

  // ---- MAIN PLAN W80F06 ----
  function calcMain(D, inp) {
    var g = genderLetter(inp.sex);
    var rateArr = D.mainRate['06' + g];
    var rate = rateArr ? rateArr[inp.age] : null;
    if (inp.age < ISSUE_MIN || inp.age > ISSUE_MAX || rate == null || rate === 0)
      return { ok: false, ineligible: true, annual: 0, mode: 0, base: 0, rate: 0, payYear: PAY_YEAR, gender: g };
    var m = modeObj(D, inp.mode);
    var annual = rd(rate * rd(inp.sa / 1000, 3), 2);            // no high-SA discount on main (Cal!F13 = 0)
    var mode = rd(annual * m.factor, 2);
    var saCap = Math.min(inp.sa, 30000000);
    var base = rd(rate * rd(saCap / 1000, 3), 2);              // I13 base used by WP/PB percent
    return { ok: true, annual: annual, mode: mode, base: base, rate: rate, payYear: PAY_YEAR, gender: g };
  }

  // ---- RIDERS (ported from validated lifeready calcRiders; shared rate sheets) ----
  function calcRiders(D, inp, main) {
    var g = main.gender, age = inp.age, m = modeObj(D, inp.mode), f = m.factor;
    var out = [];
    function push(name, annual, mode, extra) { out.push(Object.assign({ name: name, annual: rd(annual, 2), mode: rd(mode, 2) }, extra || {})); }

    // PB (Payor Benefit) — coverage/waive period capped to age 80
    if (inp.pb && inp.pb.buy) {
      var pbType = inp.pb.type || 'PB Beyond';
      var base = main.base, rate = 0, key = '', col;
      if (age <= 15) {
        var pc = pbType === 'PB Beyond' ? 'PBPDDCI' : 'PBPDD';
        col = Math.min(main.payYear, 25 - age);
        key = pc + genderLetter(inp.pb.payerSex) + inp.pb.payerAge;
        var row = D.pbRateParent[key];
        rate = row ? (row[String(col)] || 0) : 0;
      } else {
        var pc2 = pbType === 'PB Beyond' ? 'PBSDDCI' : 'PBSDD';
        col = main.payYear;
        key = pc2 + genderLetter(inp.pb.payerSex) + inp.pb.payerAge;
        var row2 = D.pbRateSpouse[key];
        rate = row2 ? (row2[String(col)] || 0) : 0;
      }
      var ann = rd(rate * rd(base / 100, 3), 2);
      push('PB (' + pbType + ')', ann, rd(ann * f, 2), { sa: base, rate: rate, key: key, col: col });
    }
    // WP Fit
    if (inp.wp && inp.wp.buy && age >= 16 && age <= 70) {
      var wkey = 'WPTPD' + g + age;
      var tbl = g === 'M' ? D.wpRateM : D.wpRateF;
      var wrow = tbl[wkey];
      var wrate = wrow ? (wrow[String(main.payYear)] || 0) : 0;
      var wann = rd(wrate * rd(main.base / 100, 3), 2);
      push('WP Fit', wann, rd(wann * f, 2), { sa: main.base, rate: wrate, key: wkey, col: main.payYear });
    }
    // AP
    if (inp.ap && inp.ap.sa > 0) {
      var arate = D.apRate[String(inp.occ || 1)] || 0;
      var aann = rd(arate * inp.ap.sa / 1000, 2);
      push('AP (อุบัติเหตุ)', aann, rd(aann * f, 2), { sa: inp.ap.sa, rate: arate });
    }
    // ECARE
    if (inp.ecare && inp.ecare.sa > 0) {
      var erate = D.ecareRate[String(inp.occ || 1)] || 0;
      var eann = rd(erate * inp.ecare.sa / 1000, 2);
      push('ECARE', eann, rd(eann * f, 2), { sa: inp.ecare.sa, rate: erate });
    }
    // MEB — table value IS the annual premium; ×1.5 if occ 4
    if (inp.meb && inp.meb.plan) {
      var mrow = D.mebRate[String(age)] || D.mebRate[age];
      var mrate = mrow ? (mrow[String(inp.meb.plan)] || 0) : 0;
      var mann = rd(mrate * occMul(inp.occ), 2);
      push('MEB', mann, rd(mann * f, 2), { sa: inp.meb.plan, rate: mrate });
    }
    // MEX — table value IS the annual premium; keyed gender-plan (e.g. 'M-3200'); ×1.5 if occ 4
    if (inp.mex && inp.mex.plan) {
      var xrow = D.mexRate[String(age)] || D.mexRate[age];
      var xrate = xrow ? (xrow[g + '-' + inp.mex.plan] || 0) : 0;
      var xann = rd(xrate * occMul(inp.occ), 2);
      push('MEX', xann, rd(xann * f, 2), { sa: inp.mex.plan, rate: xrate });
    }
    // DCI
    if (inp.dci && inp.dci.sa > 0) {
      var drow = D.dciPlsRate['DCI-' + age];
      var drate = drow ? (drow[g] || 0) : 0;
      var dann = rd(drate * inp.dci.sa / 1000, 2);
      push('DCI', dann, rd(dann * f, 2), { sa: inp.dci.sa, rate: drate });
    }
    // PLS10 — (rate − disc) × SA/1000, disc 0.5@≥500k / 1@≥1M
    if (inp.pls && inp.pls.sa > 0) {
      var pcode = inp.pls.plan || 'PLS10';
      var prow = D.dciPlsRate[pcode + '-' + age];
      var prate = prow ? (prow[g] || 0) : 0;
      var pdisc = inp.pls.sa >= 1000000 ? 1 : (inp.pls.sa >= 500000 ? 0.5 : 0);
      var pann = rd((prate - pdisc) * inp.pls.sa / 1000, 2);
      push(pcode, pann, rd(pann * f, 2), { sa: inp.pls.sa, rate: prate });
    }
    // CPR
    if (inp.cpr && inp.cpr.sa > 0) {
      var crow = D.cprRate['CPR-' + age];
      var crate = crow ? (crow[g] || 0) : 0;
      var cann = rd(crate * inp.cpr.sa / 1000, 2);
      push('CPR', cann, rd(cann * f, 2), { sa: inp.cpr.sa, rate: crate });
    }
    // HIC — needs CPR; ROUND (not ROUNDDOWN)
    if (inp.hic && inp.hic.sa > 0) {
      var hrow = D.hicRate['HIC-' + age];
      var hrate = hrow ? (hrow[g] || 0) : 0;
      var hann = rnd(hrate * inp.hic.sa / 1000, 2);
      push('HIC', hann, rd(hann * f, 2), { sa: inp.hic.sa, rate: hrate });
    }
    // iHealthy Ultra (MHP) — ×1.5 if occ 4
    if (inp.mhp && inp.mhp.plan) {
      var covMap = { 'Full': '', 'Deductible': 'D', 'Copay': 'C' };
      var areaMap = { 'ประเทศไทย': '', 'เอเชีย': 'A', 'ทั่วโลก': 'W' };
      var cs = covMap[inp.mhp.coverage || 'Full'];
      var asfx = areaMap[inp.mhp.area || 'ประเทศไทย'];
      var ageType = age < 11 ? 'J' : 'S';
      var hkey = ('MHP' + cs + inp.mhp.plan + ageType + asfx).trim() + '-' + g;
      var harr = D.mhpRate[hkey];
      var hrate2 = harr ? (harr[age] || 0) : 0;
      var hann2 = rd(hrate2 * occMul(inp.occ), 2);
      push('iHealthy Ultra', hann2, rd(hann2 * f, 2), { sa: hkey, rate: hrate2 });
    }
    // Roke Rai So Shield (MCI) — ×1.5 if occ 4
    if (inp.mci && inp.mci.plan) {
      var mciarr = D.mciRate[String(inp.mci.plan).trim() + '-' + g] || D.mciRate[String(inp.mci.plan).trim()];
      var mcirate = mciarr ? (mciarr[age] || 0) : 0;
      var mciann = rd(mcirate * occMul(inp.occ), 2);
      push('Roke Rai So Shield', mciann, rd(mciann * f, 2), { sa: inp.mci.plan, rate: mcirate });
    }
    // CI 123 — 6 components
    if (inp.ci123 && inp.ci123.sa > 0) {
      var S = inp.ci123.sa;
      var comps = [
        ['Major CI', S], ['Critical Care Benefit', S * 0.25], ['Juvenile CI', S * 0.25],
        ['Pre-Early CI', Math.min(S * 0.20, 100000)], ['Early to Intermediate CI', S * 0.25], ['Special Conditions', S * 0.10]
      ];
      var totMode = 0, parts = {};
      comps.forEach(function (c) {
        var name = c[0], saC = c[1];
        var arr = D.ci123Rate[name + '-' + g];
        var r = arr ? (arr[age] || 0) : 0;
        if (name === 'Juvenile CI' && age > 18) r = 0;
        var am = rd(r * rd(saC / 1000, 3), 2);
        var an = rd(am * f, 2);
        parts[name] = { sa: saC, rate: r, mode: an };
        totMode += an;
      });
      var ann123 = rd(totMode * m.periods, 2);
      push('CI 123 (โรคร้ายแรง)', ann123, rd(totMode, 2), { sa: S, parts: parts });
    }
    return out;
  }

  // ---- BENEFIT ILLUSTRATION TABLE (annual cash-back, death, surrender to age 80) ----
  function benefitTable(D, CV, inp) {
    var main = inp.__main || calcMain(D, inp);
    if (!main.ok) return [];
    var g = main.gender, sa = inp.sa;
    var factors = (CV[g === 'M' ? 'M' : 'F'] || {})[String(inp.age)] || [];
    var annualTotalMain = inp.annualTotalMain != null ? inp.annualTotalMain
      : rd(main.mode * modeObj(D, inp.mode).periods, 2);
    var rows = [], cum = 0, accumPrev = 0, couponsPaid = 0;
    for (var year = 1; ; year++) {
      var age = inp.age + year - 1;
      if (age > 79) break;
      var couponRate = year <= 5 ? 0.01 : (year > 5 && age < 79 ? 0.02 : (age === 79 ? 2.0 : null));
      if (couponRate == null) break;
      var premium = year <= PAY_YEAR ? annualTotalMain : 0;
      cum += premium;
      var factor = factors[year - 1] || 0;
      var surrender = round0(factor * sa / 1000);
      var death = Math.max(2 * sa, 1.01 * cum, surrender);
      var cashback = couponRate === 2.0
        ? round0(Math.max(1.01 * cum, 2 * sa, death))
        : round0(sa * couponRate);
      var accum = year === 1 ? cashback : cashback + 1.005 * accumPrev;
      var deathInclCoupons = death + couponsPaid;          // coupons paid in PRIOR years
      rows.push({ year: year, age: age, premium: premium, cumPrem: cum, cashback: cashback,
        accum: accum, death: death, deathInclCoupons: deathInclCoupons, surrender: surrender });
      accumPrev = accum;
      couponsPaid += cashback;
    }
    return rows;
  }

  // ---- CASH SURRENDER VALUE table (มูลค่าเวนคืน) ----
  function cashValues(D, CV, inp, main) {
    var mm = main || calcMain(D, inp);
    if (!mm.ok) return [];
    var factors = (CV[mm.gender === 'M' ? 'M' : 'F'] || {})[String(inp.age)] || [];
    var rows = [];
    for (var y = 1; y <= factors.length; y++) {
      var age = inp.age + y - 1; if (age > 79) break;
      rows.push({ year: y, age: age, surrender: round0((factors[y - 1] || 0) * inp.sa / 1000) });
    }
    return rows;
  }

  // ---- TOP-LEVEL ----
  function calc(D, CV, inp) {
    var main = calcMain(D, inp);
    var riders = calcRiders(D, inp, main);
    var m = modeObj(D, inp.mode);
    var modeTotal = rd(main.mode + riders.reduce(function (s, r) { return s + r.mode; }, 0), 2);
    var annualTotal = rd(main.annual + riders.reduce(function (s, r) { return s + r.annual; }, 0), 2);
    var benefit = benefitTable(D, CV, Object.assign({ __main: main, annualTotalMain: main.annual }, inp));
    return { main: main, riders: riders, modeTotal: modeTotal, annualTotal: annualTotal,
      firstPremium: modeTotal, benefit: benefit, mode: m };
  }

  return { rd: rd, rnd: rnd, genderLetter: genderLetter, calcMain: calcMain, calcRiders: calcRiders,
    benefitTable: benefitTable, cashValues: cashValues, calc: calc, PAY_YEAR: PAY_YEAR, COVER_AGE: COVER_AGE };
})();
