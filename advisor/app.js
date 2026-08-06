(function () {
  'use strict';
  var state = { messages: [], evidence: [], lastAnswer: '', busy: false };
  var $ = function (id) { return document.getElementById(id); };
  var messagesEl = $('messages');
  var questionEl = $('question');
  var sendEl = $('send');

  function profile() {
    return {
      age: $('age').value,
      gender: $('gender').value,
      budgetMonthly: $('budget').value,
      goals: Array.from(document.querySelectorAll('.goal-grid input:checked')).map(function (input) { return input.value; })
    };
  }

  function addMessage(role, text, loading) {
    var article = document.createElement('article');
    article.className = 'message message--' + role + (loading ? ' message--loading' : '');
    var mark = document.createElement('div'); mark.className = 'message__mark'; mark.textContent = role === 'assistant' ? 'AI' : 'คุณ';
    var content = document.createElement('div');
    if (role === 'assistant' && !loading) { var title = document.createElement('b'); title.textContent = 'AI Advisor'; content.appendChild(title); }
    var p = document.createElement('p'); p.textContent = text; content.appendChild(p);
    article.appendChild(mark); article.appendChild(content); messagesEl.appendChild(article); messagesEl.scrollTop = messagesEl.scrollHeight;
    return article;
  }

  function money(value) { return Number(value).toLocaleString('th-TH', { maximumFractionDigits: 2 }); }
  function labels(result) {
    if (!result || result.kind !== 'calculation') return [];
    var r = result.result || {};
    if (result.calculator === 'ci123') return [['เบี้ยรายปี', money(r.annual) + ' บาท'], ['ราย 6 เดือน', money(r.semiannual) + ' บาท'], ['รายเดือน', money(r.monthly) + ' บาท']];
    if (result.calculator === 'ihealthy') return [['เบี้ยตามงวด', money(r.premium) + ' บาท'], ['เบี้ยรายปี', money(r.annual) + ' บาท']];
    if (result.calculator === 'pension') return [['ทุนประกัน', money(r.sumAssured) + ' บาท'], ['เบี้ยต่องวด', money(r.installmentPremium) + ' บาท'], ['เบี้ยรายปี', money(r.annualPremium) + ' บาท'], ['ปีชำระเบี้ย', r.payYears + ' ปี']];
    return [];
  }

  function renderEvidence() {
    var target = $('evidence');
    var calculations = state.evidence.filter(function (item) { return item.result && item.result.kind === 'calculation'; });
    $('evidence-count').textContent = state.evidence.length ? state.evidence.length + ' แหล่งข้อมูล' : 'ยังไม่มีการคำนวณ';
    $('draft').disabled = !state.lastAnswer;
    if (!state.evidence.length) return;
    target.className = 'evidence-list'; target.replaceChildren();
    state.evidence.slice(-5).reverse().forEach(function (item) {
      var card = document.createElement('article'); card.className = 'evidence-card';
      var top = document.createElement('div'); top.className = 'evidence-card__top';
      var name = document.createElement('b'); name.textContent = item.tool.replace('calculate_', '').replace('search_products', 'คัดกรองผลิตภัณฑ์').toUpperCase();
      var verified = document.createElement('span'); verified.textContent = '✓ VERIFIED'; top.append(name, verified); card.appendChild(top);
      var rows = labels(item.result);
      if (!rows.length && item.result.matches) rows = [['พบ', item.result.matches.length + ' แนวทาง'], ['ประเภท', 'คัดกรองตามเป้าหมาย']];
      var dl = document.createElement('dl'); rows.forEach(function (row) { var dt = document.createElement('dt'); dt.textContent = row[0]; var dd = document.createElement('dd'); dd.textContent = row[1]; dl.append(dt, dd); }); card.appendChild(dl);
      if (item.result.calculatorUrl) { var a = document.createElement('a'); a.href = item.result.calculatorUrl; a.textContent = 'เปิดเครื่องมือฉบับเต็ม →'; card.appendChild(a); }
      target.appendChild(card);
    });
    if (!calculations.length) $('draft').disabled = false;
  }

  async function ask(text) {
    text = String(text || '').trim(); if (!text || state.busy) return;
    state.busy = true; sendEl.disabled = true; questionEl.value = '';
    addMessage('user', text); state.messages.push({ role: 'user', content: text });
    var pending = addMessage('assistant', 'กำลังตรวจข้อมูลและเลือกเครื่องมือ', true);
    try {
      var response = await fetch('../api/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: state.messages.slice(-10), profile: profile() }) });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถติดต่อ AI Advisor ได้');
      pending.remove(); addMessage('assistant', data.answer);
      state.messages.push({ role: 'assistant', content: data.answer }); state.lastAnswer = data.answer;
      state.evidence = state.evidence.concat(Array.isArray(data.evidence) ? data.evidence : []).slice(-12); renderEvidence();
    } catch (error) { pending.remove(); addMessage('assistant', 'ขออภัย — ' + error.message + '\nโปรดลองใหม่ หรือตรวจว่าเปิดเว็บด้วย `npm run dev:ai`'); }
    finally { state.busy = false; sendEl.disabled = false; questionEl.focus(); }
  }

  $('composer').addEventListener('submit', function (event) { event.preventDefault(); ask(questionEl.value); });
  questionEl.addEventListener('keydown', function (event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('composer').requestSubmit(); } });
  document.querySelectorAll('[data-prompt]').forEach(function (button) { button.addEventListener('click', function () { questionEl.value = button.dataset.prompt; questionEl.focus(); }); });
  $('reset').addEventListener('click', function () { state = { messages: [], evidence: [], lastAnswer: '', busy: false }; messagesEl.innerHTML = ''; addMessage('assistant', 'เริ่มบทสนทนาใหม่แล้ว บอกเป้าหมายหรือคำถามได้เลย'); $('evidence').className = 'evidence-empty'; $('evidence').innerHTML = '<div class="seal">✓</div><b>ตัวเลขที่ตรวจสอบได้<br>จะแสดงที่นี่</b><p>ทุกครั้งที่ Advisor เรียก engine หรือตาราง ระบบจะแสดงแหล่งข้อมูล อินพุต และผลลัพธ์</p>'; renderEvidence(); });
  $('draft').addEventListener('click', function () {
    var p = profile(); var quote = $('quote');
    $('quote-date').textContent = new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
    $('quote-profile').textContent = 'อายุ: ' + (p.age || 'ไม่ระบุ') + ' · เพศ: ' + ({ male: 'ชาย', female: 'หญิง', unspecified: 'ไม่ระบุ' }[p.gender]) + ' · งบ/เดือน: ' + (p.budgetMonthly ? money(p.budgetMonthly) + ' บาท' : 'ไม่ระบุ');
    $('quote-answer').textContent = state.lastAnswer;
    var ev = $('quote-evidence'); ev.replaceChildren(); state.evidence.filter(function (item) { return item.result && item.result.kind === 'calculation'; }).forEach(function (item) { var a = document.createElement('article'); var b = document.createElement('b'); b.textContent = item.result.productId + ' — ' + item.result.source; var detail = document.createElement('p'); detail.textContent = labels(item.result).map(function (row) { return row.join(': '); }).join(' · '); a.append(b, detail); ev.appendChild(a); });
    quote.hidden = false; setTimeout(function () { window.print(); }, 80);
  });
})();
