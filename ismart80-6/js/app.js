// iSmart 80/6 — UI. Presentation only; ALL arithmetic is in engine.js (window.IS80).
(function () {
  var DATA = window.DATA, CV = window.CV, IS80 = window.IS80;

  // ---------- money inputs (thousand separators; mirrors ishield) ----------
  function grpMoney(v) { v = String(v == null ? '' : v).replace(/[^0-9]/g, ''); return v ? (+v).toLocaleString('en-US') : ''; }
  function moneyVal(el) { return el ? (+(String(el.value || '').replace(/[^0-9.]/g, '')) || 0) : 0; }
  // live comma grouping while typing; idempotent per element so it survives rider re-injection
  function attachMoney(root) {
    (root || document).querySelectorAll('input.money').forEach(function (el) {
      if (el.dataset.moneyBound) return; el.dataset.moneyBound = '1';
      el.value = grpMoney(el.value);
      el.addEventListener('input', function () {
        var start = el.selectionStart || 0, before = el.value.length;
        el.value = grpMoney(el.value);
        var pos = Math.max(0, start + (el.value.length - before));
        try { el.setSelectionRange(pos, pos); } catch (e) {}
      });
    });
  }

  // ---------- form: main inputs ----------
  function modeFactor(mode) { var m = DATA.modes.filter(function (x) { return x.th === mode; })[0]; return m ? m.factor : 1; }
  function mainRate(age, sex) { var arr = DATA.mainRate['06' + IS80.genderLetter(sex)] || []; return arr[age] || 0; }
  function currentCalcBy() { var r = document.querySelector('input[name=calcby]:checked'); return r ? r.value : 'SA'; }

  // reverse of  modePrem = rd(rd(rate × rd(SA/1000,3),2) × factor, 2)  →  SA ≈ prem/factor/rate×1000
  function deriveSA(age, sex, mode, prem) {
    var rate = mainRate(age, sex), f = modeFactor(mode);
    if (!rate || !prem) return 0;
    return Math.max(0, Math.round((prem / f / rate * 1000) / 1000) * 1000); // ปัดเป็นหลักพัน
  }

  function mainInputs() {
    var age = parseInt($('fAge').value, 10), sex = $('fSex').value, mode = $('fMode').value, by = currentCalcBy();
    var sa;
    if (by === 'PREM') {
      sa = deriveSA(age, sex, mode, moneyVal($('fPrem')));
      $('fSA').value = sa ? grpMoney(sa) : '';
    } else {
      sa = moneyVal($('fSA'));
    }
    return {
      name: $('fName').value || 'คุณคนพิเศษ', age: age, sex: sex, mode: mode,
      mainSA: sa, sa: sa, occ: parseInt($('fOcc').value, 10), calcBy: by
    };
  }

  // ---------- rider rows ----------
  function riderControl(r, age) {
    // returns HTML for the control cell of rider r
    var id = 'r_' + r.key;
    if (r.ctl === 'buy') {
      return '<label class="chk"><input type="checkbox" id="' + id + '_buy"> ซื้อ</label>';
    }
    if (r.ctl === 'sa') {
      return '<label class="chk"><input type="checkbox" id="' + id + '_buy" aria-label="ซื้อ ' + r.name + '"> ซื้อ</label>' +
        '<input type="text" inputmode="numeric" class="money" id="' + id + '_sa" placeholder="ทุน (บาท)" aria-label="จำนวนเงินเอาประกันภัย ' + r.name + ' (บาท)">';
    }
    // plan pickers
    var opts = '', list = [];
    if (r.ctl === 'planMHP') list = MHP_PLANS(age);
    opts = '<option value="">ไม่ซื้อ</option>' + list.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
    return '<select id="' + id + '_plan" aria-label="เลือกแผน ' + r.name + '">' + opts + '</select>';
  }

  function buildRiders() {
    var age = parseInt($('fAge').value, 10) || 44;
    var html = RIDERS.map(function (r) {
      var elig = age >= r.min && age <= r.max;
      return '<div class="rider" data-key="' + r.key + '"' + (elig ? '' : ' style="opacity:.45"') + '>' +
        '<div class="rider__ck"></div>' +
        '<div><div class="rider__name">' + r.name + '</div><div class="rider__desc">' + r.desc +
        ' · อายุ ' + r.min + '–' + r.max + '</div></div>' +
        '<div class="rider__ctl">' + (elig ? riderControl(r, age) : '<span class="rider__desc">อายุไม่เข้าเกณฑ์</span>') + '</div>' +
        '</div>';
    }).join('');
    $('ridersBox').innerHTML = html;
    attachMoney($('ridersBox'));
  }

  // ---------- read rider selections into engine input ----------
  function readRiders(inp) {
    RIDERS.forEach(function (r) {
      var id = 'r_' + r.key, buy = $(id + '_buy'), plan = $(id + '_plan'), sa = $(id + '_sa');
      if (r.ctl === 'buy') {
        if (buy && buy.checked) inp.wp = { buy: true };
      } else if (r.ctl === 'sa') {
        if (buy && buy.checked) {
          var v = moneyVal(sa);
          if (v > 0) inp[r.key] = { sa: v };
          // ticked "buy" but no SA entered → flag so validate() surfaces it (never drop coverage silently)
          else (inp._missingSA || (inp._missingSA = [])).push(r.name);
        }
      } else if (plan && plan.value) {
        inp[r.key] = { plan: plan.value };
      }
    });
    return inp;
  }

  // ---------- validation ----------
  function validate(inp) {
    var errs = [];
    if (isNaN(inp.age) || inp.age < PLAN.issueMin || inp.age > PLAN.issueMax) errs.push('อายุผู้เอาประกันต้องอยู่ระหว่าง ' + PLAN.issueMin + '–' + PLAN.issueMax + ' ปี');
    if (inp.mainSA < PLAN.saMin) errs.push('จำนวนเงินเอาประกันภัยขั้นต่ำ ' + fmt0(PLAN.saMin) + ' บาท');
    // rider ticked "buy" but no sum-assured entered — block instead of silently dropping the rider
    if (inp._missingSA) inp._missingSA.forEach(function (n) { errs.push(n + ': กรุณาระบุจำนวนเงินเอาประกันภัย (ทุน) หรือยกเลิกการเลือกซื้อ'); });
    // rider SA min/max + age windows
    RIDERS.forEach(function (r) {
      var active = (r.ctl === 'buy' && inp.wp) || (r.ctl === 'sa' && inp[r.key]) || (/^plan/.test(r.ctl) && inp[r.key]);
      if (!active) return;
      if (inp.age < r.min || inp.age > r.max) errs.push(r.name + ': อายุไม่เข้าเกณฑ์ (' + r.min + '–' + r.max + ')');
      if (r.ctl === 'sa' && inp[r.key]) {
        var s = inp[r.key].sa, smax = r.smax ? r.smax(inp) : Infinity;
        if (s < r.smin) errs.push(r.name + ': ทุนขั้นต่ำ ' + fmt0(r.smin) + ' บาท');
        if (s > smax) errs.push(r.name + ': ทุนสูงสุด ' + fmt0(smax) + ' บาท');
      }
    });
    // exclusive / dependency
    RIDER_RULES.exclusive.forEach(function (pair) {
      if (inp[pair[0]] && inp[pair[1]]) errs.push('เลือก ' + pair[0].toUpperCase() + ' หรือ ' + pair[1].toUpperCase() + ' อย่างใดอย่างหนึ่ง');
    });
    return errs;
  }

  // ---------- render result ----------
  function money(n) { return fmt(n); }

  function renderPremium(res, inp) {
    var rows = '<tr><td>' + PLAN.name + '</td><td>' + fmt0(inp.mainSA) + '</td><td>' + money(res.main.mode) + '</td></tr>';
    res.riders.forEach(function (r) {
      rows += '<tr><td>' + r.name + '</td><td>' + (typeof r.sa === 'number' ? fmt0(r.sa) : (r.sa || '-')) + '</td><td>' + money(r.mode) + '</td></tr>';
    });
    rows += '<tr class="total"><td>รวมเบี้ยประกันภัย (' + inp.mode + ')</td><td></td><td>' + money(res.modeTotal) + ' บาท</td></tr>';
    if (inp.mode !== 'รายปี') rows += '<tr class="total"><td>รวมเบี้ยประกันภัยรายปี</td><td></td><td>' + money(res.annualTotal) + ' บาท</td></tr>';
    return '<div class="res-section"><div class="res-h">สรุปเบี้ยประกันภัย</div>' +
      '<div class="res-meta">ผู้เอาประกันภัย: ' + inp.name + ' · เพศ ' + inp.sex + ' · อายุ ' + inp.age + ' ปี · งวดชำระ ' + inp.mode +
      ' · ชำระเบี้ย 6 ปี คุ้มครองถึงอายุ 80 ปี' +
      (inp.calcBy === 'PREM' ? ' · <span style="color:#6b7280">คำนวณจากเบี้ย (ทุนประกันปัดเป็นหลักพัน)</span>' : '') + '</div>' +
      '<div class="tbl-scroll"><table class="sumtbl"><thead><tr><th scope="col">ความคุ้มครอง</th><th scope="col">ทุนประกัน/แผน</th><th scope="col">เบี้ย (' + inp.mode + ')</th></tr></thead><tbody>' +
      rows + '</tbody></table></div></div>';
  }

  // เบี้ย iHealthy Ultra รายปี (เปลี่ยนตามอายุ) — ใช้แผนที่เลือกไว้ ความคุ้มครอง Full / พื้นที่ไทย
  // (ค่าเดียวกับที่ใช้ในสรุปเบี้ย). ROUNDDOWN 2 ตำแหน่งให้ตรงกับ engine (rd).
  function ihYearlyPremium(inp, age) {
    if (!inp.mhp || !inp.mhp.plan || age > 80) return null;
    var g = IS80.genderLetter(inp.sex);
    var key = 'MHP' + inp.mhp.plan + (age < 11 ? 'J' : 'S') + '-' + g;
    var arr = DATA.mhpRate[key];
    var rate = arr ? (arr[age] || 0) : 0;
    if (!rate) return 0;
    var occM = (inp.occ === 4 || inp.occ === '4') ? 1.5 : 1;
    return Math.floor(rate * occM * 100 + 1e-7) / 100; // rd(_, 2)
  }

  function renderBenefit(res, inp) {
    var b = res.benefit;
    var ihActive = !!(inp.mhp && inp.mhp.plan);
    var ihTotal = 0, saved = 0, outOfPocket = 0;
    var rows = b.map(function (r) {
      var cls = r.age === 79 ? ' class="mat"' : '';
      var tr = '<tr' + cls + '><td>' + r.age + '</td><td>' + r.year + '</td><td>' + fmt0(r.premium) + '</td>' +
        '<td>' + fmt0(r.cumPrem) + '</td>' +
        '<td>' + fmt0(r.cashback) + '</td>' +
        '<td>' + fmt0(r.death) + '</td><td>' + fmt0(r.deathInclCoupons) + '</td><td>' + fmt0(r.surrender) + '</td>';
      if (ihActive) {
        var ih = ihYearlyPremium(inp, r.age);
        // เงินคืนรายปี (ไม่รวมเงินครบกำหนด 200% ที่อายุ 79) เอามาช่วยจ่ายเบี้ยสุขภาพ
        var annualCB = r.age <= 78 ? r.cashback : 0;
        var after = ih == null ? null : Math.max(0, ih - annualCB); // เบี้ยสุขภาพที่ยังต้องจ่ายเอง
        if (ih) { ihTotal += ih; saved += Math.min(ih, annualCB); outOfPocket += after; }
        tr += '<td>' + (ih ? fmt0(ih) : '–') + '</td>' +
          '<td' + (after === 0 ? ' class="net-pos"' : '') + '>' + (ih == null ? '–' : (after === 0 ? '0' : fmt0(after))) + '</td>';
      }
      return tr + '</tr>';
    }).join('');
    var ihHead = ihActive
      ? '<th scope="col">เบี้ย iHealthy Ultra<br>(ต่อปี)</th><th scope="col">เบี้ยสุขภาพ<br>หลังหักเงินคืน</th>'
      : '';
    var ihFoot = ihActive
      ? '<tfoot><tr class="tot"><td colspan="8" style="text-align:right">รวม</td><td>' + fmt0(ihTotal) + '</td>' +
        '<td>' + fmt0(outOfPocket) + '</td></tr></tfoot>'
      : '';
    var ihSummary = ihActive
      ? '<div class="ih-summary">เงินคืนจาก ไอสมาร์ท 80/6 ช่วยลดค่าเบี้ยสุขภาพ iHealthy Ultra ไป <b>' + fmt0(saved) + ' บาท</b> ตลอดสัญญา · คงเหลือจ่ายเอง <b>' + fmt0(outOfPocket) + ' บาท</b></div>'
      : '';
    var ihNote = ihActive
      ? ' · <span style="color:#2563eb">คอลัมน์ท้าย “เบี้ยสุขภาพหลังหักเงินคืน” = เบี้ย iHealthy ส่วนที่เงินคืนจ่ายไม่พอ (0 = เงินคืนจ่ายครบทั้งปี)</span>'
      : '';
    return '<div class="res-section"><div class="res-h">ตารางแสดงผลประโยชน์ (ทุนประกัน ' + fmt0(inp.mainSA) + ' บาท)</div>' +
      '<div class="res-meta">เงินจ่ายคืนรายปี 1% (ปี 1–5) / 2% (ปี 6 เป็นต้นไป) · ครบกำหนดสัญญาอายุ 80 ปี รับ 200% ของทุนประกัน · ' +
      'ความคุ้มครองเสียชีวิตขั้นต่ำ 200% ของทุนประกัน' + ihNote + '</div>' +
      '<div class="tbl-scroll"><table class="bentbl"><thead><tr>' +
      '<th scope="col">อายุ</th><th scope="col">ปีที่</th><th scope="col">เบี้ยประกันภัย<br>สัญญาหลัก (ต่อปี)</th><th scope="col">เบี้ยประกันภัย<br>สะสม</th><th scope="col">เงินจ่ายคืน<br>(ต่อปี)</th>' +
      '<th scope="col">ความคุ้มครอง<br>เสียชีวิต</th><th scope="col">ผลประโยชน์เสียชีวิต<br>รวมเงินคืนที่จ่ายแล้ว</th><th scope="col">มูลค่าเวนคืน<br>กรมธรรม์</th>' + ihHead +
      '</tr></thead><tbody>' + rows + '</tbody>' + ihFoot + '</table></div>' + ihSummary +
      '<p class="res-meta">หมายเหตุ: ตัวเลขเป็นเพียงตัวอย่างประกอบการเสนอขาย ผลประโยชน์และเงื่อนไขเป็นไปตามที่กำหนดในกรมธรรม์</p></div>';
  }

  function showResult(res, inp) {
    $('resultBody').innerHTML = renderPremium(res, inp) + renderBenefit(res, inp);
    $('page-input').style.display = 'none';
    $('page-result').style.display = '';
    $('stepA').classList.remove('az-active'); $('stepB').classList.add('az-active');
    window.scrollTo(0, 0);
  }

  // ---------- events ----------
  function doCalc() {
    var inp = readRiders(mainInputs());
    var errs = validate(inp);
    if (errs.length) { $('inputErr').innerHTML = errs.map(function (e) { return '• ' + e; }).join('<br>'); return; }
    $('inputErr').innerHTML = '';
    var res = IS80.calc(DATA, CV, inp);
    if (!res.main.ok) { $('inputErr').textContent = 'ไม่สามารถคำนวณเบี้ยสัญญาหลักได้ (ตรวจสอบอายุ/ทุนประกัน)'; return; }
    showResult(res, inp);
  }

  function init() {
    buildRiders();
    attachMoney(document); // static money inputs (fSA / fPrem)
    Array.prototype.forEach.call(document.getElementsByName('calcby'), function (r) {
      r.addEventListener('change', function () {
        var prem = currentCalcBy() === 'PREM';
        $('wrapPrem').style.display = prem ? '' : 'none';
        $('wrapSA').style.display = prem ? 'none' : '';
      });
    });
    $('fAge').addEventListener('change', buildRiders);
    $('fSex').addEventListener('change', function () { STATE.sex = $('fSex').value; });
    $('btnCalc').addEventListener('click', doCalc);
    $('btnBack').addEventListener('click', function () {
      $('page-result').style.display = 'none'; $('page-input').style.display = '';
      $('stepB').classList.remove('az-active'); $('stepA').classList.add('az-active'); window.scrollTo(0, 0);
    });
    $('btnPrint').addEventListener('click', function () { if (window.azPrint) azPrint(); else window.print(); });

    // print-safety: if the user prints without generating a quote, auto-calculate with current
    // values; if that can't produce a quote (invalid input), hide the form + show a hint (ci123 model)
    window.addEventListener('beforeprint', function () {
      var onResult = $('page-result').style.display !== 'none';
      if (!onResult) { try { doCalc(); } catch (e) {} onResult = $('page-result').style.display !== 'none'; }
      document.body.classList.toggle('print-noquote', !onResult);
    });
    window.addEventListener('afterprint', function () { document.body.classList.remove('print-noquote'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
