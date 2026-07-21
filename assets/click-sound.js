/* Advisortool — UI click sounds (Web Audio, ไม่มีไฟล์เสียง, ออฟไลน์ได้).
   เล่นเสียงคลิกสั้นๆ ตอนแตะปุ่ม/ลิงก์/การ์ด ทั้งแอป.
   include ใน <head> ของทุกหน้า หลัง pin-gate. ปุ่มเปิด/ปิดเสียงลอยมุมล่างซ้าย
   (เหนือปุ่มล็อก) ค่าจำใน localStorage['az_sound']. ใช้คลาส .az-lock-btn ร่วม
   (มาจาก pin-gate.css) เพื่อสไตล์/ซ่อนตอนพิมพ์เหมือนกัน. */
(function () {
  // เล่นเสียงเมื่อแตะ element ที่กดได้
  var SEL = 'button, a[href], [role="button"], summary, input[type="button"], input[type="submit"]';
  var KEY = 'az_sound';

  var on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) {}

  var actx = null;
  function ctx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { actx = new AC(); } catch (e) { return null; }
    }
    if (actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    return actx;
  }

  // เสียงคลิกสั้นแบบ percussive (ซองเสียงขึ้นเร็ว-ตกเร็ว) ระดับเบา
  function blip(freq) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g); g.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }
  function play(freq) { if (on) blip(freq || 480); }

  // ดักคลิกทั้งเอกสาร (capture)
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var el = t.closest(SEL);
    if (!el) return;
    if (el.id === 'az-sound-btn') return; // ปุ่ม mute เล่นเสียงยืนยันเอง กันซ้ำ
    play(480);
  }, true);

  var ICON_ON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
  var ICON_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';

  var btn = null;
  function updateBtn() {
    if (!btn) return;
    btn.innerHTML = on ? ICON_ON : ICON_OFF;
    btn.title = on ? 'ปิดเสียง' : 'เปิดเสียง';
    btn.setAttribute('aria-label', on ? 'ปิดเสียง' : 'เปิดเสียง');
    btn.style.opacity = on ? '0.7' : '0.55';
  }
  function mountBtn() {
    if (document.getElementById('az-sound-btn')) return;
    btn = document.createElement('button');
    btn.id = 'az-sound-btn';
    btn.type = 'button';
    btn.className = 'az-lock-btn';   // ยืมสไตล์ + ซ่อนตอนพิมพ์จาก pin-gate.css
    btn.style.bottom = '62px';       // วางเหนือปุ่มล็อก (ปุ่มล็อกอยู่ bottom:14px)
    btn.addEventListener('click', function () { window.azSound.toggle(); });
    updateBtn();
    document.body.appendChild(btn);
  }

  window.azSound = {
    isOn: function () { return on; },
    set: function (v) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
      updateBtn();
    },
    toggle: function () { window.azSound.set(!on); if (on) play(600); }
  };

  if (document.body) mountBtn();
  else document.addEventListener('DOMContentLoaded', mountBtn);
})();
