/* Advisortool — PIN gate. ตรวจ PIN ผ่าน Supabase RPC (az_gate_verify) ฝั่งเซิร์ฟเวอร์ —
   ค่า PIN จริงไม่เคยถูกส่งมาที่เบราว์เซอร์เลย. include ใน <head> ของทุกหน้า หลัง
   supabase.min.js + pin-gate.config.js. รันแบบ synchronous เพื่อไม่ให้หน้าจริงแว้บก่อนฉากล็อก
   (การตรวจ PIN เองเป็น async แต่การซ่อน/แสดงหน้ายังคง synchronous เหมือนเดิม). */
(function () {
  var CFG = window.PIN_GATE_CONFIG || {};
  var KEY = CFG.storageKey || 'az_gate';
  var IDLE = CFG.idleTimeoutMs || 12 * 60 * 60 * 1000;
  var MAX = CFG.maxAttempts || 5;
  var LOCKOUT = (CFG.lockoutSeconds || 30) * 1000;
  var TITLE = CFG.title || 'กรุณาใส่รหัสผ่าน';
  var SUBTITLE = CFG.subtitle || 'Advisortool';
  var CONFIG_OK = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  var LOCK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  var mem = null; // fallback ถ้า localStorage ใช้ไม่ได้ (โหมดส่วนตัว)
  var sb = null;

  function getSb() {
    if (!sb && window.supabase && CFG.supabaseUrl && CFG.supabaseAnonKey) {
      sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
    }
    return sb;
  }
  function toolId() {
    var seg = location.pathname.split('/').filter(Boolean)[0];
    return seg || 'hub';
  }

  function readState() {
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return mem; }
  }
  function writeState(obj) {
    mem = obj;
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {}
  }
  function clearState() {
    mem = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
  }
  function unlock() { writeState({ unlocked: true, ts: Date.now() }); }

  function isUnlocked() {
    if (!CONFIG_OK) return false;
    var s = readState();
    if (!s || s.unlocked !== true || typeof s.ts !== 'number') return false;
    if (Date.now() - s.ts > IDLE) return false;
    return true;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function onReady(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function mountLockButton() {
    if (document.getElementById('az-lock-btn')) return;
    var b = document.createElement('button');
    b.id = 'az-lock-btn';
    b.type = 'button';
    b.className = 'az-lock-btn';
    b.title = 'ล็อก';
    b.setAttribute('aria-label', 'ล็อก');
    b.innerHTML = LOCK_ICON;
    b.addEventListener('click', function () { window.azLock(); });
    document.body.appendChild(b);
  }

  // public: ล็อกทันที (ใช้โดยปุ่มล็อกลอย)
  window.azLock = function () { clearState(); location.reload(); };

  // ปลดอยู่แล้ว → ต่ออายุ sliding timeout, เพิ่มปุ่มล็อก, แสดงหน้าปกติ
  if (isUnlocked()) {
    unlock();
    onReady(mountLockButton);
    return;
  }

  // ยังไม่ปลด → ซ่อนหน้า + แสดง keypad
  var root = document.documentElement;
  root.classList.add('az-locked');

  var overlay = document.createElement('div');
  overlay.className = 'az-pin';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', TITLE);

  if (!CONFIG_OK) {
    overlay.innerHTML =
      '<div class="az-pin__card">' +
        '<div class="az-pin__title">ตั้งค่า Supabase ไม่ถูกต้อง</div>' +
        '<div class="az-pin__msg az-pin__msg--show">กรุณาตั้ง supabaseUrl/supabaseAnonKey ใน assets/pin-gate.config.js</div>' +
      '</div>';
    root.appendChild(overlay);
    return;
  }

  function padBtn(d) { return '<button type="button" class="az-pin__key" data-d="' + d + '">' + d + '</button>'; }

  overlay.innerHTML =
    '<div class="az-pin__card">' +
      '<div class="az-pin__brand">' + esc(SUBTITLE) + '</div>' +
      '<div class="az-pin__title">' + esc(TITLE) + '</div>' +
      '<div class="az-pin__dots" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="az-pin__msg" role="alert"></div>' +
      '<div class="az-pin__pad">' +
        padBtn('1') + padBtn('2') + padBtn('3') +
        padBtn('4') + padBtn('5') + padBtn('6') +
        padBtn('7') + padBtn('8') + padBtn('9') +
        '<span class="az-pin__spacer"></span>' +
        padBtn('0') +
        '<button type="button" class="az-pin__key az-pin__key--back" data-back aria-label="ลบ">⌫</button>' +
      '</div>' +
    '</div>';
  root.appendChild(overlay);

  var dots = overlay.querySelectorAll('.az-pin__dots span');
  var msgEl = overlay.querySelector('.az-pin__msg');
  var padEl = overlay.querySelector('.az-pin__pad');
  var cardEl = overlay.querySelector('.az-pin__card');

  var entered = '';
  var attempts = 0;
  var lockedUntil = 0;
  var checking = false;

  function renderDots() {
    for (var i = 0; i < dots.length; i++) dots[i].className = i < entered.length ? 'is-filled' : '';
  }
  function setMsg(text) {
    msgEl.textContent = text || '';
    msgEl.className = 'az-pin__msg' + (text ? ' az-pin__msg--show' : '');
  }
  function shake() {
    cardEl.classList.remove('az-shake');
    void cardEl.offsetWidth; // บังคับ reflow เพื่อเริ่ม animation ใหม่
    cardEl.classList.add('az-shake');
  }
  function press(d) {
    if (checking || Date.now() < lockedUntil || entered.length >= 6) return;
    entered += d;
    renderDots();
    if (entered.length === 6) submit();
  }
  function back() {
    if (checking || Date.now() < lockedUntil) return;
    entered = entered.slice(0, -1);
    renderDots();
  }
  function submit() {
    var client = getSb();
    if (!client) {
      setMsg('โหลดระบบตรวจสอบไม่สำเร็จ กรุณารีเฟรชหน้า');
      entered = '';
      renderDots();
      return;
    }
    checking = true;
    padEl.classList.add('is-disabled');
    setMsg('กำลังตรวจสอบ...');
    client.rpc('az_gate_verify', {
      input_pin: entered,
      input_tool: toolId(),
      input_ua: navigator.userAgent
    }).then(function (res) {
      checking = false;
      padEl.classList.remove('is-disabled');
      if (res.error) {
        setMsg('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง');
        entered = '';
        renderDots();
        return;
      }
      var data = res.data || {};
      if (data.ok) {
        unlock();
        overlay.classList.add('az-pin--out');
        setTimeout(function () {
          root.classList.remove('az-locked');
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          onReady(mountLockButton);
          // เผื่อหน้าโหลดตอนล็อก (body ถูกซ่อน) แล้วมีกราฟ/เลย์เอาต์ที่วัดขนาดตอนโหลด
          // ให้วัดใหม่หลังโชว์ (defense-in-depth สำหรับเครื่องมือที่ใช้ Chart.js ฯลฯ)
          try { window.dispatchEvent(new Event('resize')); } catch (e) {}
        }, 260);
        return;
      }
      entered = '';
      renderDots();
      shake();
      if (data.locked) {
        setMsg('ใส่ผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่');
        return;
      }
      attempts++;
      if (attempts >= MAX) startLockout();
      else setMsg('รหัสไม่ถูกต้อง ลองใหม่');
    }).catch(function () {
      // เผื่อ RPC promise reject เอง (ไม่ใช่ res.error) — อย่าให้คีย์แพดค้าง
      checking = false;
      padEl.classList.remove('is-disabled');
      entered = '';
      renderDots();
      setMsg('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง');
    });
  }
  function startLockout() {
    lockedUntil = Date.now() + LOCKOUT;
    padEl.classList.add('is-disabled');
    (function tick() {
      var remain = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remain > 0) { setMsg('ใส่ผิดหลายครั้ง กรุณารอ ' + remain + ' วินาที'); setTimeout(tick, 500); }
      else { attempts = 0; padEl.classList.remove('is-disabled'); setMsg(''); }
    })();
  }

  overlay.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.hasAttribute('data-d')) press(t.getAttribute('data-d'));
    else if (t.hasAttribute('data-back')) back();
  });
  document.addEventListener('keydown', function (e) {
    if (!root.classList.contains('az-locked')) return;
    if (e.key && e.key.length === 1 && e.key >= '0' && e.key <= '9') { press(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { back(); e.preventDefault(); }
  });

  try { overlay.tabIndex = -1; overlay.focus(); } catch (e) {}
})();
