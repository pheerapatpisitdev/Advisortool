/* Advisortool — PIN gate. ตรวจรหัส frontend ก่อน แล้วตรวจ PIN ปกติผ่าน Supabase RPC
   (az_gate_verify) ฝั่งเซิร์ฟเวอร์. include ใน <head> ของทุกหน้า หลัง
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
  var SUPABASE_OK = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var FRONTEND_PIN = String(CFG.frontendPin || '');
  var SUPABASE_TIMEOUT = Number(CFG.supabaseTimeoutMs) || 8000;
  var FRONTEND_OK = /^\d{6}$/.test(FRONTEND_PIN);
  var CONFIG_OK = SUPABASE_OK || FRONTEND_OK;

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

  // ยังไม่ปลด → ซ่อนหน้า + แสดงฟอร์มกรอกรหัส
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
        '<div class="az-pin__title">ตั้งค่าระบบตรวจสอบไม่ถูกต้อง</div>' +
        '<div class="az-pin__msg az-pin__msg--show">กรุณาตั้งค่า Supabase หรือ frontendPin ใน assets/pin-gate.config.js</div>' +
      '</div>';
    root.appendChild(overlay);
    return;
  }

  overlay.innerHTML =
    '<div class="az-pin__card">' +
      '<div class="az-pin__brand">' + esc(SUBTITLE) + '</div>' +
      '<div class="az-pin__title">' + esc(TITLE) + '</div>' +
      '<form class="az-pin__form" novalidate>' +
        '<input class="az-pin__input" type="password" inputmode="numeric" autocomplete="one-time-code" ' +
          'maxlength="6" placeholder="••••••" aria-label="' + esc(TITLE) + '">' +
        '<div class="az-pin__msg" role="alert"></div>' +
        '<button type="submit" class="az-pin__submit">ยืนยัน</button>' +
      '</form>' +
    '</div>';
  root.appendChild(overlay);

  var formEl = overlay.querySelector('.az-pin__form');
  var inputEl = overlay.querySelector('.az-pin__input');
  var submitEl = overlay.querySelector('.az-pin__submit');
  var msgEl = overlay.querySelector('.az-pin__msg');
  var cardEl = overlay.querySelector('.az-pin__card');

  var attempts = 0;
  var lockedUntil = 0;
  var checking = false;

  function setMsg(text) {
    msgEl.textContent = text || '';
    msgEl.className = 'az-pin__msg' + (text ? ' az-pin__msg--show' : '');
  }
  function shake() {
    cardEl.classList.remove('az-shake');
    void cardEl.offsetWidth; // บังคับ reflow เพื่อเริ่ม animation ใหม่
    cardEl.classList.add('az-shake');
  }
  function setDisabled(on) {
    inputEl.disabled = on;
    submitEl.disabled = on;
    formEl.classList.toggle('is-disabled', on);
  }
  function reset() {
    inputEl.value = '';
    try { inputEl.focus(); } catch (e) {}
  }
  function completeUnlock() {
    unlock();
    overlay.classList.add('az-pin--out');
    setTimeout(function () {
      root.classList.remove('az-locked');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      onReady(mountLockButton);
      // เผื่อหน้าโหลดตอนล็อก (body ถูกซ่อน) แล้วมีกราฟ/เลย์เอาต์ที่วัดขนาดตอนโหลด
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    }, 260);
  }
  function handleConnectionFailure() {
    checking = false;
    setDisabled(false);
    reset();
    setMsg(FRONTEND_OK ? 'เชื่อมต่อ Supabase ไม่ได้ กรุณาใช้รหัสฉุกเฉิน' : 'เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง');
  }
  function verifyWithSupabase(client, pin) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve({ error: { message: 'Supabase request timed out' } });
      }, SUPABASE_TIMEOUT);

      client.rpc('az_gate_verify', {
        input_pin: pin,
        input_tool: toolId(),
        input_ua: navigator.userAgent
      }).then(function (res) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(res);
      }).catch(function (error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
    });
  }
  function submit() {
    if (checking || Date.now() < lockedUntil) return;
    var pin = inputEl.value.replace(/\D/g, '');
    if (pin.length !== 6) {
      setMsg('กรุณาใส่รหัส 6 หลัก');
      shake();
      return;
    }

    // รหัสพิเศษฝั่ง frontend: ตรวจและปลดล็อกทันทีโดยไม่เรียก Supabase
    if (FRONTEND_OK && pin === FRONTEND_PIN) {
      completeUnlock();
      return;
    }

    checking = true;
    setDisabled(true);
    setMsg('กำลังตรวจสอบ...');
    var client = getSb();
    if (!client) {
      handleConnectionFailure();
      return;
    }
    verifyWithSupabase(client, pin).then(function (res) {
      checking = false;
      setDisabled(false);
      if (res.error) {
        checking = true;
        setDisabled(true);
        handleConnectionFailure();
        return;
      }
      var data = res.data || {};
      if (data.ok) {
        completeUnlock();
        return;
      }
      reset();
      shake();
      if (data.locked) {
        setMsg('ใส่ผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่');
        return;
      }
      attempts++;
      if (attempts >= MAX) startLockout();
      else setMsg('รหัสไม่ถูกต้อง ลองใหม่');
    }).catch(function () {
      // เผื่อ RPC promise reject เอง (ไม่ใช่ res.error) — ลองรหัสฉุกเฉินแทน
      handleConnectionFailure();
    });
  }
  function startLockout() {
    lockedUntil = Date.now() + LOCKOUT;
    setDisabled(true);
    (function tick() {
      var remain = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remain > 0) { setMsg('ใส่ผิดหลายครั้ง กรุณารอ ' + remain + ' วินาที'); setTimeout(tick, 500); }
      else { attempts = 0; setDisabled(false); setMsg(''); reset(); }
    })();
  }

  // รับเฉพาะตัวเลข ไม่เกิน 6 หลัก
  inputEl.addEventListener('input', function () {
    var v = inputEl.value.replace(/\D/g, '').slice(0, 6);
    if (inputEl.value !== v) inputEl.value = v;
    if (msgEl.textContent) setMsg('');
  });
  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    submit();
  });

  try { inputEl.focus(); } catch (e) {}
})();
