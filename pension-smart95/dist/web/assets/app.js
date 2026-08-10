/* ===== UI App for บำนาญ สมาร์ท 95 (two-view: input -> results) ===== */
(function () {
  'use strict';
  const eng = new PensionEngine(window.DB);
  const $ = id => document.getElementById(id);
  const fmt = (n, d) => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('th-TH', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const fmt2 = n => fmt(n, 2);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // money inputs: live thousands-separator + comma-stripping parse
  const groupCommas = el => { if (!el) return; const raw = String(el.value).replace(/[^0-9]/g, ''); el.value = raw === '' ? '' : Number(raw).toLocaleString('en-US'); };
  const numv = id => { const el = $(id); return el ? (parseFloat(String(el.value).replace(/,/g, '')) || 0) : 0; };

  const S = { gender: 'ชาย', payOption: 'ชำระเบี้ย จนรับเงินบำนาญ', annuityAge: 70, inputType: 'จำนวนเงินเอาประกันภัย' };
  let lastResult = null;

  const RIDERS = [
    { code: 'pb', name: 'PB — พีบี (ผู้ชำระเบี้ย)', sub: 'คุ้มครองผู้ชำระเบี้ย', tag: 'ผู้ชำระเบี้ย 20–70', fields: [
        { k: 'variant', t: 'select', label: 'แผน', opts: [['Fit', 'PB Fit (เสียชีวิต+ทุพพลภาพ)'], ['Beyond', 'PB Beyond (+โรคร้ายแรง)']] },
        { k: 'payorAge', t: 'num', label: 'อายุผู้ชำระเบี้ย', val: 40 },
        { k: 'payorGender', t: 'seg', label: 'เพศผู้ชำระเบี้ย', opts: [['ชาย', 'ชาย'], ['หญิง', 'หญิง']] } ] },
    { code: 'wp', name: 'WP — ดับบลิวพี (ยกเว้นเบี้ย)', sub: 'ยกเว้นเบี้ยเมื่อทุพพลภาพ', tag: '16–70 ปี', fields: [
        { k: 'variant', t: 'select', label: 'แผน', opts: [['Fit', 'WP Fit (ทุพพลภาพ)'], ['Beyond', 'WP Beyond (+โรคร้ายแรง)']] } ] },
    { code: 'ap', name: 'AP — อุบัติเหตุ', sub: 'คุ้มครองอุบัติเหตุ', tag: '1ด.–60 ปี', fields: [
        { k: 'sa', t: 'num', label: 'จำนวนเงินเอาประกันภัย (บาท)', val: 1000000, step: 100000 } ] },
    { code: 'ecare', name: 'E-CARE — อุบัติเหตุ (เพิ่ม)', sub: 'อุบัติเหตุส่วนเพิ่ม', tag: '16–60 ปี', fields: [
        { k: 'sa', t: 'num', label: 'จำนวนเงินเอาประกันภัย (บาท)', val: 1000000, step: 100000 } ] },
    { code: 'meb', name: 'MEB — ชดเชยรายวัน', sub: 'ชดเชยรายวันเมื่อนอน รพ.', tag: '6–65 ปี', fields: [
        { k: 'plan', t: 'selectDyn', label: 'แผน (ชดเชย/วัน)', dyn: 'meb' } ] },
    { code: 'dci', name: 'DCI — โรคร้ายแรง', sub: 'เจอ-จ่าย โรคร้ายแรง', tag: '20–65 ปี', fields: [
        { k: 'sa', t: 'num', label: 'จำนวนเงินเอาประกันภัย (บาท)', val: 1000000, step: 100000 } ] },
    { code: 'pls', name: 'PLS — คุ้มครองชีวิต (เพิ่ม)', sub: 'คุ้มครองชีวิตชั่วระยะเวลา', tag: '20–59 ปี', fields: [
        { k: 'code', t: 'select', label: 'แผน', opts: [['PLS05', 'PLS 5 ปี'], ['PLS10', 'PLS 10 ปี'], ['PLS12', 'PLS 12 ปี'], ['PLS15', 'PLS 15 ปี']] },
        { k: 'sa', t: 'num', label: 'จำนวนเงินเอาประกันภัย (บาท)', val: 1000000, step: 100000 } ] },
    { code: 'mhp', name: 'iHealthy Ultra — สุขภาพเหมาจ่าย', sub: 'ค่ารักษาเหมาจ่ายครบวงจร', tag: '6–80 ปี', fields: [
        { k: 'plan', t: 'selectDyn', label: 'แผน', dyn: 'mhpPlan' },
        { k: 'area', t: 'selectDyn', label: 'พื้นที่ความคุ้มครอง', dyn: 'mhpArea' },
        { k: 'coverage', t: 'select', label: 'รูปแบบความรับผิดส่วนแรก', opts: [['Full', 'ความคุ้มครองเต็มจำนวน'], ['Deductible', 'มีความรับผิดส่วนแรก'], ['Co-Payment', 'ร่วมจ่าย Co-Payment']] } ] }
  ];
  const RD = {};
  RIDERS.forEach(r => { RD[r.code] = { on: false }; r.fields.forEach(f => RD[r.code][f.k] = (f.val != null ? f.val : (f.opts ? f.opts[0][0] : ''))); });

  function seg(el, val, cb) {
    const btns = el.querySelectorAll('button');
    btns.forEach(b => {
      const sel = b.dataset.v === val;
      b.classList.toggle('on', sel);
      b.setAttribute('aria-checked', String(sel));
      b.onclick = () => {
        if (b.disabled) return;
        btns.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); });
        cb(b.dataset.v);
      };
    });
  }

  // ---------- INPUT-PAGE UI (no results) ----------
  function renderInputUI() {
    const age = +$('age').value || 0;
    renderAnnuityOptions(age);
    refreshDynSelects(age);
    RIDERS.forEach(r => { const el = $('rd_' + r.code); if (el) { el.classList.toggle('on', RD[r.code].on); const h = el.querySelector('.rider-h'); if (h) h.setAttribute('aria-expanded', String(RD[r.code].on)); } });
    // amount label/hint
    const lbls = { 'จำนวนเงินเอาประกันภัย': 'จำนวนเงินเอาประกันภัย (บาท)', 'เบี้ยประกันภัย': 'เบี้ยประกันภัยสัญญาหลักต่อปี (บาท)', 'เงินบำนาญรายเดือน': 'เงินบำนาญรายเดือนที่ต้องการ (บาท)' };
    const hints = { 'จำนวนเงินเอาประกันภัย': 'ทุนประกันขั้นต่ำ 75,000 — สูงสุด 20,000,000 บาท', 'เบี้ยประกันภัย': 'ระบบจะคำนวณทุนประกันที่ได้จากเบี้ยที่กำหนด', 'เงินบำนาญรายเดือน': 'ระบบจะคำนวณทุนประกันจากบำนาญรายเดือนที่ต้องการ' };
    $('amtLabel').textContent = lbls[S.inputType];
    $('amtHint').textContent = hints[S.inputType];
    const plan = eng.selectPlan(S.annuityAge, S.payOption);
    $('planStep').textContent = plan ? plan.planCode : '—';
    $('calcErr').textContent = '';
  }

  function renderAnnuityOptions(age) {
    const avail = eng.availablePlans(age, S.payOption).map(p => p.annuityAge);
    const el = $('annuitySeg');
    el.innerHTML = [55, 60, 65, 70].map(a => `<button type="button" role="radio" aria-checked="false" data-v="${a}">${a} ปี</button>`).join('');
    if (!avail.includes(S.annuityAge) && avail.length) S.annuityAge = avail[avail.length - 1];
    el.querySelectorAll('button').forEach(b => {
      const a = +b.dataset.v;
      b.disabled = !avail.includes(a);
      const on = a === S.annuityAge;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
      b.onclick = () => { if (!b.disabled) { S.annuityAge = a; renderInputUI(); } };
    });
    $('annuityErr').textContent = avail.length ? '' : 'อายุนี้ไม่สามารถสมัครแบบประกันได้ (รับประกันอายุ 20–65 ปี ขึ้นกับแผน)';
  }

  function buildRiders() {
    const host = $('riderList'); host.innerHTML = '';
    RIDERS.forEach(r => {
      const wrap = document.createElement('div');
      wrap.className = 'rider'; wrap.id = 'rd_' + r.code;
      wrap.innerHTML = `<div class="rider-h" role="button" tabindex="0" aria-expanded="false" aria-label="${esc(r.name)}"><div class="chk">✓</div>
           <div class="nm">${r.name}<small>${r.sub}</small></div>
           <div class="tag">${r.tag}</div></div>
         <div class="rider-b">${r.fields.map(f => fieldHTML(r.code, f)).join('')}</div>`;
      const head = wrap.querySelector('.rider-h');
      const toggle = () => { RD[r.code].on = !RD[r.code].on; renderInputUI(); };
      head.onclick = e => { if (e.target.closest('.rider-b')) return; toggle(); };
      head.onkeydown = e => { if (e.target.closest('.rider-b')) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
      host.appendChild(wrap);
    });
    bindRiderFields();
  }
  function fieldHTML(code, f) {
    const id = `f_${code}_${f.k}`, v = RD[code][f.k];
    if (f.t === 'num') return `<div class="az-field"><label for="${id}">${f.label}</label><input type="number" id="${id}" value="${v}" step="${f.step || 1}"></div>`;
    if (f.t === 'select') return `<div class="az-field"><label for="${id}">${f.label}</label><select id="${id}">${f.opts.map(o => `<option value="${o[0]}" ${o[0] == v ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
    if (f.t === 'selectDyn') return `<div class="az-field"><label for="${id}">${f.label}</label><select id="${id}"></select></div>`;
    if (f.t === 'seg') return `<div class="az-field"><label id="${id}_lbl">${f.label}</label><div class="az-seg" id="${id}" role="radiogroup" aria-labelledby="${id}_lbl">${f.opts.map(o => `<button type="button" role="radio" aria-checked="${o[0] == v ? 'true' : 'false'}" data-v="${o[0]}" class="${o[0] == v ? 'on' : ''}">${o[1]}</button>`).join('')}</div></div>`;
    return '';
  }
  function bindRiderFields() {
    RIDERS.forEach(r => r.fields.forEach(f => {
      const el = $(`f_${r.code}_${f.k}`); if (!el) return;
      if (f.t === 'seg') seg(el, RD[r.code][f.k], v => { RD[r.code][f.k] = v; renderInputUI(); });
      else el.oninput = () => { RD[r.code][f.k] = (f.t === 'num' ? +el.value : el.value); renderInputUI(); };
    }));
  }
  function refreshDynSelects(age) {
    setDyn('f_meb_plan', eng.mebPlans(age).map(p => [p, `${fmt(p)} บาท/วัน`]), RD.meb, 'plan');
    setDyn('f_mhp_plan', eng.mhpPlans(age).map(p => [p, p]), RD.mhp, 'plan');
    setDyn('f_mhp_area', eng.mhpAreas(RD.mhp.plan).map(a => [a, a]), RD.mhp, 'area');
  }
  function setDyn(id, opts, store, key) {
    const el = $(id); if (!el) return;
    const cur = String(store[key]);
    el.innerHTML = opts.map(o => `<option value="${o[0]}" ${String(o[0]) === cur ? 'selected' : ''}>${o[1]}</option>`).join('');
    if (!opts.some(o => String(o[0]) === cur) && opts.length) { store[key] = opts[0][0]; el.value = opts[0][0]; }
  }

  function gatherRiders(occ) {
    const out = {};
    RIDERS.forEach(r => {
      const st = RD[r.code]; if (!st.on) return;
      if (r.code === 'pb') out.pb = { buy: true, variant: st.variant, payorAge: +st.payorAge, payorGender: st.payorGender };
      else if (r.code === 'wp') out.wp = { buy: true, variant: st.variant };
      else if (r.code === 'ap') out.ap = { sa: +st.sa, occ };
      else if (r.code === 'ecare') out.ecare = { sa: +st.sa, occ };
      else if (r.code === 'meb') out.meb = { plan: +st.plan, occ };
      else if (r.code === 'dci') out.dci = { sa: +st.sa, occ };
      else if (r.code === 'pls') out.pls = { code: st.code, sa: +st.sa, occ };
      else if (r.code === 'mhp') out.mhp = { plan: st.plan, area: st.area, coverage: st.coverage, occ };
    });
    return out;
  }

  // ---------- CALCULATE (button) ----------
  function calculate() {
    const age = +$('age').value || 0;
    const occ = +$('occ').value || 1;
    if (age < 20 || age > 65) { return showErr('กรุณากรอกอายุระหว่าง 20–65 ปี'); }
    const avail = eng.availablePlans(age, S.payOption).map(p => p.annuityAge);
    if (!avail.includes(S.annuityAge)) { return showErr('อายุ ' + age + ' ปี ไม่สามารถเลือกแบบรับบำนาญอายุ ' + S.annuityAge + ' ปีได้'); }
    const amount = numv('amount');
    if (amount <= 0) { return showErr('กรุณากรอกจำนวนเงิน'); }
    const input = { age, gender: S.gender, annuityAge: S.annuityAge, payOption: S.payOption, mode: $('mode').value, inputType: S.inputType, amount, riders: gatherRiders(occ) };
    const res = eng.compute(input);
    if (res.error) return showErr(res.error);
    if (res.base.SA < 75000) return showErr('ทุนประกันที่ได้ (' + fmt(res.base.SA) + ') ต่ำกว่าขั้นต่ำ 75,000 บาท — กรุณาเพิ่มจำนวนเงิน');
    if (res.base.SA > 20000000) return showErr('ทุนประกันที่ได้ (' + fmt(res.base.SA) + ') สูงกว่าสูงสุด 20,000,000 บาท — กรุณาลดจำนวนเงิน');
    lastResult = res;
    renderResults(res, input);
    renderTax();
    showView('result');
  }
  function showErr(msg) { $('calcErr').textContent = msg; try { $('calcErr').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }

  function showView(v) {
    const input = v === 'input';
    $('viewInput').classList.toggle('az-active', input);
    $('viewResult').classList.toggle('az-active', !input);
    $('stepA').classList.toggle('az-active', input);
    $('stepB').classList.toggle('az-active', !input);
    $('stepBar').classList.toggle('az-done', !input);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  // ---------- RESULTS RENDER ----------
  function renderResults(res, input) {
    const b = res.base, plan = b.plan;
    $('verName').textContent = plan.productName;
    $('modeStep').textContent = input.mode;
    $('resSummary').innerHTML = `<b>${esc($('custName').value || 'ผู้เอาประกันภัย')}</b> · เพศ${S.gender} อายุ ${b.__age} ปี · <b>${plan.productName}</b> · ทุน ${fmt(b.SA)} บาท · งวด${input.mode}`;

    $('kSA').innerHTML = fmt(b.SA) + ' <small>บาท</small>';
    const sched = res.annuitySchedule;
    const firstBand = sched[0], lastBand = sched[sched.length - 1];
    const firstMonthly = Math.round(b.SA * PensionEngine.MONTHLY_FACTOR_FIRST);
    const firstAnnual = firstBand.annualPension;
    $('kPenLbl').textContent = `บำนาญช่วงแรก (อายุ ${plan.annuityStartAge}–75)`;
    $('kPension').innerHTML = fmt(firstMonthly) + ' <small>บาท/เดือน</small>';
    $('kPensionSub').textContent = `หรือ ${fmt(firstAnnual)} บาท/ปี (${Math.round(firstBand.pct * 100)}% ของทุน) เพิ่มเป็น ${Math.round(lastBand.pct * 100)}% เมื่ออายุ 86+`;
    $('kTotal').innerHTML = fmt2(res.totalModePremium) + ' <small>บาท</small>';
    $('kTotalSub').textContent = `งวด${input.mode} · เบี้ยรวมทั้งปี ${fmt2(res.totalAnnualPremium)} บาท`;

    let html = `<tr class="sub-h"><td colspan="3">สัญญาหลัก</td></tr>`;
    html += rowP(plan.productName, b.modePremium, `อัตรา ${b.rate} ต่อ 1,000 · ทุน ${fmt(b.SA)}`);
    const onR = res.riders.filter(r => r && r.eligible), badR = res.riders.filter(r => r && !r.eligible);
    if (onR.length) { html += `<tr class="sub-h"><td colspan="3">สัญญาเพิ่มเติม</td></tr>`; onR.forEach(r => html += rowP(r.label, r.mode, r.rate ? `อัตรา ${r.rate}` : '')); }
    if (badR.length) badR.forEach(r => html += `<tr><td class="lbl" style="color:var(--az-bad)">${r.label}</td><td colspan="2" style="color:var(--az-bad);font-size:12px">${r.note || 'ไม่อยู่ในเกณฑ์'}</td></tr>`);
    html += `<tr class="total"><td class="lbl">เบี้ยประกันภัยรวม (งวด${input.mode})</td><td></td><td>${fmt2(res.totalModePremium)}</td></tr>`;
    $('premBody').innerHTML = html;

    renderIllustration(res);
  }
  function rowP(label, val, sub) { return `<tr><td class="lbl">${label}${sub ? `<br><span style="font-weight:400;color:var(--az-muted);font-size:11.5px">${sub}</span>` : ''}</td><td></td><td>${fmt2(val)}</td></tr>`; }

  function renderIllustration(res) {
    const ill = res.illustration, b = res.base;
    $('illusNote').innerHTML = `แบบ <b>${b.plan.productName}</b> · เพศ${res.base.__gender} อายุ ${res.base.__age} ปี · ทุนประกัน ${fmt(b.SA)} บาท · ชำระเบี้ย ${b.payYears} ปี · IRR (กรณีมีชีวิตถึงครบสัญญา) ≈ <b>${res.irr != null ? (res.irr * 100).toFixed(2) + '%' : '—'}</b>`;
    let html = '';
    ill.forEach(r => { html += `<tr class="${r.age >= b.plan.annuityStartAge ? 'annu-band' : ''}"><td>${r.age}</td><td>${r.policyYear}</td><td>${r.premium ? fmt(r.premium) : '–'}</td><td>${fmt(r.cumPremium)}</td><td>${r.cashValue ? fmt(r.cashValue) : '–'}</td><td>${fmt(r.deathBenefit)}</td><td>${r.pension ? fmt(r.pension) : '–'}</td><td>${r.cumPension ? fmt(r.cumPension) : '–'}</td></tr>`; });
    $('illusBody').innerHTML = html;
  }
  function renderTax() {
    const t = eng.tax({ income: numv('txIncome'), pvd: numv('txRetire'), gpf: 0, teacher: 0, rmf: 0,
      existingOrdinaryLife: numv('txOrdinary'), existingAnnuity: numv('txAnnuity'), marginalRate: (+$('txRate').value || 0) / 100 });
    $('txMax').textContent = fmt(t.maxAnnuityPremium) + ' บาท';
    $('txBenefit').textContent = fmt2(t.taxBenefit) + ' บาท';
    $('txNote').textContent = t.note;
  }

  // ---------- bind ----------
  function bind() {
    seg($('genderSeg'), S.gender, v => { S.gender = v; renderInputUI(); });
    seg($('payOptSeg'), S.payOption, v => { S.payOption = v; renderInputUI(); });
    seg($('inputTypeSeg'), S.inputType, v => { S.inputType = v; const def = { 'จำนวนเงินเอาประกันภัย': 100000, 'เบี้ยประกันภัย': 100000, 'เงินบำนาญรายเดือน': 10000 }; $('amount').value = Number(def[v]).toLocaleString('en-US'); renderInputUI(); });
    // live comma grouping (money fields only — attach first so parse reads a clean value)
    ['amount', 'txIncome', 'txRetire', 'txOrdinary', 'txAnnuity'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', () => groupCommas(el)); });
    ['age', 'occ', 'amount'].forEach(id => $(id).addEventListener('input', renderInputUI));
    ['txIncome', 'txRate', 'txRetire', 'txOrdinary', 'txAnnuity'].forEach(id => $(id).addEventListener('input', renderTax));
    $('btnCalc').onclick = calculate;
    $('btnBack').onclick = () => showView('input');
    buildRiders();
  }
  bind();
  renderInputUI();
})();
