// iSmart 80/6 — UI. Presentation only; ALL arithmetic is in engine.js (window.IS80).
(function () {
  var DATA = window.DATA, CV = window.CV, IS80 = window.IS80;

  // ---------- form: main inputs ----------
  function mainInputs() {
    return {
      name: $('fName').value || 'คุณคนพิเศษ',
      age: parseInt($('fAge').value, 10),
      sex: $('fSex').value,
      mode: $('fMode').value,
      mainSA: parseFloat($('fSA').value) || 0,
      sa: parseFloat($('fSA').value) || 0,
      occ: parseInt($('fOcc').value, 10)
    };
  }

  // ---------- rider rows ----------
  function riderControl(r, age) {
    // returns HTML for the control cell of rider r
    var id = 'r_' + r.key;
    if (r.ctl === 'pb') {
      return '<label class="chk"><input type="checkbox" id="' + id + '_buy"> ซื้อ</label>' +
        '<input type="number" id="' + id + '_page" placeholder="อายุผู้ชำระ" min="20" max="70">' +
        '<select id="' + id + '_psex"><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option></select>';
    }
    if (r.ctl === 'buy') {
      return '<label class="chk"><input type="checkbox" id="' + id + '_buy"> ซื้อ</label>';
    }
    if (r.ctl === 'sa') {
      return '<label class="chk"><input type="checkbox" id="' + id + '_buy"> ซื้อ</label>' +
        '<input type="number" id="' + id + '_sa" placeholder="ทุน (บาท)" step="1000">';
    }
    // plan pickers
    var opts = '', list = [];
    if (r.ctl === 'planMEB') list = MEB_PLANS(age).map(function (p) { return [p, fmt0(p) + ' บาท/วัน']; });
    if (r.ctl === 'planMEX') list = MEX_PLANS(age).map(function (p) { return [p, 'แผน ' + fmt0(p)]; });
    if (r.ctl === 'planMHP') list = MHP_PLANS(age);
    if (r.ctl === 'planMCI') list = MCI_PLANS(age);
    opts = '<option value="">ไม่ซื้อ</option>' + list.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
    return '<select id="' + id + '_plan">' + opts + '</select>';
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
  }

  // ---------- read rider selections into engine input ----------
  function readRiders(inp) {
    RIDERS.forEach(function (r) {
      var id = 'r_' + r.key, buy = $(id + '_buy'), plan = $(id + '_plan'), sa = $(id + '_sa');
      if (r.ctl === 'pb') {
        if (buy && buy.checked) inp.pb = { buy: true, type: 'PB Beyond', payerAge: parseInt(($(id + '_page') || {}).value, 10), payerSex: ($(id + '_psex') || {}).value };
      } else if (r.ctl === 'buy') {
        if (buy && buy.checked) inp.wp = { buy: true };
      } else if (r.ctl === 'sa') {
        if (buy && buy.checked && sa && parseFloat(sa.value) > 0) inp[r.key] = { sa: parseFloat(sa.value) };
      } else if (plan && plan.value) {
        var v = plan.value;
        var key = (r.ctl === 'planMEB' || r.ctl === 'planMEX') ? { plan: parseInt(v, 10) } : { plan: v };
        inp[r.key === 'mhp' ? 'mhp' : r.key === 'mci' ? 'mci' : r.key] = key;
      }
    });
    return inp;
  }

  // ---------- validation ----------
  function validate(inp) {
    var errs = [];
    if (isNaN(inp.age) || inp.age < PLAN.issueMin || inp.age > PLAN.issueMax) errs.push('อายุผู้เอาประกันต้องอยู่ระหว่าง ' + PLAN.issueMin + '–' + PLAN.issueMax + ' ปี');
    if (inp.mainSA < PLAN.saMin) errs.push('จำนวนเงินเอาประกันภัยขั้นต่ำ ' + fmt0(PLAN.saMin) + ' บาท');
    // rider SA min/max + age windows
    RIDERS.forEach(function (r) {
      var sel = inp[r.key === 'pb' ? 'pb' : r.key === 'wp' ? 'wp' : r.key];
      var active = (r.key === 'pb' && inp.pb) || (r.key === 'wp' && inp.wp) || (r.ctl === 'sa' && inp[r.key]) ||
        (/^plan/.test(r.ctl) && inp[r.key === 'mhp' ? 'mhp' : r.key === 'mci' ? 'mci' : r.key]);
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
      var a = inp[pair[0]] || (pair[0] === 'pb' && inp.pb) || (pair[0] === 'wp' && inp.wp);
      var b = inp[pair[1]] || (pair[1] === 'pb' && inp.pb) || (pair[1] === 'wp' && inp.wp);
      if (a && b) errs.push('เลือก ' + pair[0].toUpperCase() + ' หรือ ' + pair[1].toUpperCase() + ' อย่างใดอย่างหนึ่ง');
    });
    if (inp.hic && !inp.cpr) errs.push('HIC ต้องซื้อคู่กับ CPR');
    var apEc = (inp.ap ? inp.ap.sa : 0) + (inp.ecare ? inp.ecare.sa : 0);
    if (apEc > 5 * inp.mainSA) errs.push('AP + ECARE รวมกันเกิน 5 เท่าของทุนประกัน');
    if (inp.pb && (!inp.pb.payerAge || inp.pb.payerAge < 20 || inp.pb.payerAge > 70)) errs.push('PB Beyond: อายุผู้ชำระเบี้ยต้องอยู่ระหว่าง 20–70 ปี');
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
      ' · ชำระเบี้ย 6 ปี คุ้มครองถึงอายุ 80 ปี</div>' +
      '<div class="tbl-scroll"><table class="sumtbl"><thead><tr><th>ความคุ้มครอง</th><th>ทุนประกัน/แผน</th><th>เบี้ย (' + inp.mode + ')</th></tr></thead><tbody>' +
      rows + '</tbody></table></div></div>';
  }

  function renderBenefit(res, inp) {
    var b = res.benefit;
    var rows = b.map(function (r) {
      var cls = r.age === 79 ? ' class="mat"' : '';
      return '<tr' + cls + '><td>' + r.age + '</td><td>' + r.year + '</td><td>' + fmt0(r.premium) + '</td>' +
        '<td>' + fmt0(r.cumPrem) + '</td>' +
        '<td>' + fmt0(r.cashback) + '</td><td>' + fmt0(Math.round(r.accum)) + '</td>' +
        '<td>' + fmt0(r.death) + '</td><td>' + fmt0(r.deathInclCoupons) + '</td><td>' + fmt0(r.surrender) + '</td></tr>';
    }).join('');
    return '<div class="res-section"><div class="res-h">ตารางแสดงผลประโยชน์ (ทุนประกัน ' + fmt0(inp.mainSA) + ' บาท)</div>' +
      '<div class="res-meta">เงินจ่ายคืนรายปี 1% (ปี 1–5) / 2% (ปี 6 เป็นต้นไป) · ครบกำหนดสัญญาอายุ 80 ปี รับ 200% ของทุนประกัน · ' +
      'ความคุ้มครองเสียชีวิตขั้นต่ำ 200% ของทุนประกัน</div>' +
      '<div class="tbl-scroll"><table class="bentbl"><thead><tr>' +
      '<th>อายุ</th><th>ปีที่</th><th>เบี้ยประกันภัย<br>สัญญาหลัก (ต่อปี)</th><th>เบี้ยประกันภัย<br>สะสม</th><th>เงินจ่ายคืน<br>(ต่อปี)</th><th>เงินจ่ายคืนสะสม<br>(ดอกเบี้ย 0.5%)</th>' +
      '<th>ความคุ้มครอง<br>เสียชีวิต</th><th>ผลประโยชน์เสียชีวิต<br>รวมเงินคืนที่จ่ายแล้ว</th><th>มูลค่าเวนคืน<br>กรมธรรม์</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
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
    $('fAge').addEventListener('change', buildRiders);
    $('fSex').addEventListener('change', function () { STATE.sex = $('fSex').value; });
    $('btnCalc').addEventListener('click', doCalc);
    $('btnBack').addEventListener('click', function () {
      $('page-result').style.display = 'none'; $('page-input').style.display = '';
      $('stepB').classList.remove('az-active'); $('stepA').classList.add('az-active'); window.scrollTo(0, 0);
    });
    $('btnPrint').addEventListener('click', function () { window.print(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
