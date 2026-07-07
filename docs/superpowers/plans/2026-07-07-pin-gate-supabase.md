# PIN Gate → Supabase-Verified Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move AdvisorTool's shared PIN gate from a client-visible plaintext PIN list to a Supabase-verified check (security-definer RPC), with a per-attempt access log and server-side brute-force lockout, without changing the unlock UX once a PIN is accepted.

**Architecture:** Two new tables (`az_gate_pins`, `az_gate_access_log`) and one `security definer` RPC function (`az_gate_verify`) live in the existing Supabase project **83G30M** (`yovibeztstpexajpuyyb`), namespaced `az_gate_*`. `assets/pin-gate.js` (shared by all 14 tool pages) calls the RPC asynchronously instead of comparing against a local array; `assets/pin-gate.config.js` carries only the Supabase URL + anon key (no PINs). A new self-hosted `assets/supabase.min.js` provides the `window.supabase` client.

**Tech Stack:** Supabase (Postgres + PostgREST RPC), vanilla JS (`assets/pin-gate.js`), `@supabase/supabase-js@2.108.2` UMD build.

---

## Reference values (used verbatim in later tasks)

- Project ID: `yovibeztstpexajpuyyb`
- Project URL: `https://yovibeztstpexajpuyyb.supabase.co`
- Publishable (anon) key: `sb_publishable_8LnqhRHZKBTI9qUueCahPA_lKEMNc0K`
- The 8 existing PINs live only in `assets/pin-gate.config.js` (`pins: [...]` array) — **never write the literal digit values into this plan, a commit message, or any other git-tracked file.** Task 3 reads them straight out of that file at execution time and only ever sends them to Postgres (which stores just the bcrypt hash).
- `pgcrypto` is already installed in this project, in the `extensions` schema — all calls below use `extensions.crypt` / `extensions.gen_salt` explicitly so they don't depend on `search_path`.

---

### Task 1: Create `az_gate_pins` and `az_gate_access_log` tables (schema only)

**Where:** Supabase project `yovibeztstpexajpuyyb`, via the `mcp__claude_ai_Supabase__apply_migration` tool (not a repo file).

- [ ] **Step 1: Apply the schema migration**

Call `apply_migration` with:
- `project_id`: `yovibeztstpexajpuyyb`
- `name`: `create_az_gate_tables`
- `query`:
```sql
create table public.az_gate_pins (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.az_gate_access_log (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid references public.az_gate_pins(id) on delete set null,
  label_snapshot text,
  tool text,
  user_agent text,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);

alter table public.az_gate_pins enable row level security;
alter table public.az_gate_access_log enable row level security;

revoke all on public.az_gate_pins from anon, authenticated;
revoke all on public.az_gate_access_log from anon, authenticated;
```

- [ ] **Step 2: Verify the tables exist with RLS on and no grants to anon/authenticated**

Call `mcp__claude_ai_Supabase__execute_sql` with `project_id: yovibeztstpexajpuyyb` and:
```sql
select c.relname, c.relrowsecurity,
  (select count(*) from information_schema.role_table_grants g
   where g.table_name = c.relname and g.grantee in ('anon','authenticated')) as grants_to_anon_or_auth
from pg_class c
where c.relname in ('az_gate_pins','az_gate_access_log');
```
Expected: both rows show `relrowsecurity = true` and `grants_to_anon_or_auth = 0`.

---

### Task 2: Create the `az_gate_verify` RPC function

**Where:** Supabase project `yovibeztstpexajpuyyb`, via `apply_migration`.

- [ ] **Step 1: Apply the function migration**

Call `apply_migration` with:
- `project_id`: `yovibeztstpexajpuyyb`
- `name`: `create_az_gate_verify_function`
- `query`:
```sql
create or replace function public.az_gate_verify(input_pin text, input_tool text, input_ua text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text;
  v_recent_fails int;
  v_match record;
begin
  v_ip := coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown');

  select count(*) into v_recent_fails
  from public.az_gate_access_log
  where ip = v_ip and success = false and created_at > now() - interval '30 seconds';

  if v_recent_fails >= 5 then
    return jsonb_build_object('ok', false, 'locked', true);
  end if;

  select id, label into v_match
  from public.az_gate_pins
  where active = true and pin_hash = extensions.crypt(input_pin, pin_hash)
  limit 1;

  insert into public.az_gate_access_log (pin_id, label_snapshot, tool, user_agent, ip, success)
  values (v_match.id, v_match.label, input_tool, input_ua, v_ip, v_match.id is not null);

  if v_match.id is not null then
    return jsonb_build_object('ok', true);
  else
    return jsonb_build_object('ok', false, 'locked', false);
  end if;
end;
$$;

grant execute on function public.az_gate_verify(text, text, text) to anon;
```

- [ ] **Step 2: Verify the grant**

Call `execute_sql` with:
```sql
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_name = 'az_gate_verify';
```
Expected: a row with `grantee = anon` and `privilege_type = EXECUTE`.

---

### Task 3: Seed the 8 existing PINs

**Where:** Supabase project `yovibeztstpexajpuyyb`, via `execute_sql`.

**Security rule for this task:** the 8 real PIN digit-strings must **never** be written into this plan file, a commit message, a code comment, or any other git-tracked artifact. Read them from the live (soon to be deleted, see Task 6) `assets/pin-gate.config.js` at execution time and pass them straight into a live `execute_sql` tool call — never into a file that gets saved or committed.

- [ ] **Step 1: Read the current PINs from the live config file**

Run:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('assets/pin-gate.config.js', 'utf8');
const m = src.match(/pins:\s*\[([^\]]+)\]/);
console.log(JSON.stringify(m[1].match(/\d{6}/g)));
"
```
This prints the 8 current PINs as a JSON array of strings, read straight from the file. Keep this output only in your working memory for the next step — do not paste it into any file you save or commit.

- [ ] **Step 2: Insert the 8 PINs, hashed, with placeholder labels**

Using the 8 values from Step 1 in order, call `execute_sql` (project `yovibeztstpexajpuyyb`) with this query, substituting each real digit-string for its `<pin N>` placeholder (the placeholders below exist only so this checked-in plan never holds the real values — the actual tool call you make will have real digits in it, that's expected and fine since `execute_sql` calls aren't persisted to git):
```sql
insert into public.az_gate_pins (label, pin_hash) values
  ('PIN 1', extensions.crypt('<pin 1>', extensions.gen_salt('bf'))),
  ('PIN 2', extensions.crypt('<pin 2>', extensions.gen_salt('bf'))),
  ('PIN 3', extensions.crypt('<pin 3>', extensions.gen_salt('bf'))),
  ('PIN 4', extensions.crypt('<pin 4>', extensions.gen_salt('bf'))),
  ('PIN 5', extensions.crypt('<pin 5>', extensions.gen_salt('bf'))),
  ('PIN 6', extensions.crypt('<pin 6>', extensions.gen_salt('bf'))),
  ('PIN 7', extensions.crypt('<pin 7>', extensions.gen_salt('bf'))),
  ('PIN 8', extensions.crypt('<pin 8>', extensions.gen_salt('bf')));
```

- [ ] **Step 3: Verify 8 rows exist and are properly hashed**

Call `execute_sql` with:
```sql
select label, active, length(pin_hash) as hash_len from public.az_gate_pins order by label;
```
Expected: 8 rows, `active = true`, `hash_len = 60` for all (a bcrypt hash is always 60 characters; a bare 6-digit PIN stored by mistake would show `hash_len = 6`).

---

### Task 4: Test the RPC directly with SQL before touching any client code

**Where:** Supabase project `yovibeztstpexajpuyyb`, via `execute_sql`. Uses a **dedicated throwaway test PIN** (`999999`), never one of the 8 real production PINs — keeps this task free of any real credential and keeps test noise out of the real access log.

- [ ] **Step 1: Insert a throwaway test PIN**

```sql
insert into public.az_gate_pins (label, pin_hash) values ('__TEST__', extensions.crypt('999999', extensions.gen_salt('bf')));
```

- [ ] **Step 2: Correct (test) PIN succeeds**

```sql
select public.az_gate_verify('999999', 'test-tool', 'test-agent');
```
Expected: `{"ok": true}`.

- [ ] **Step 3: Wrong PIN fails without locking**

```sql
select public.az_gate_verify('000000', 'test-tool', 'test-agent');
```
Expected: `{"ok": false, "locked": false}`.

- [ ] **Step 4: 5 wrong attempts in a row trigger server-side lock**

```sql
select public.az_gate_verify('000000', 'test-tool', 'test-agent') from generate_series(1,5);
```
Then immediately:
```sql
select public.az_gate_verify('999999', 'test-tool', 'test-agent');
```
Expected: the last call returns `{"ok": false, "locked": true}` — **even with the correct test PIN** — because the IP-based lockout in `az_gate_verify` checks failures before checking the PIN at all.

- [ ] **Step 5: Confirm the access log recorded everything, including the correct-PIN attempt that got locked out**

```sql
select label_snapshot, tool, success, created_at
from public.az_gate_access_log
where tool = 'test-tool'
order by created_at;
```
Expected: **6 rows total**, not 8 — the RPC's lockout branch returns before reaching the `insert` (by design, see Task 2), so once the 5-fail threshold is hit, neither the 5th batch call nor the final locked-out correct-PIN call gets logged. The 6 logged rows are: 1 success (Step 2), 1 fail (Step 3), then the first 4 of the 5 batch calls in Step 4 (the 4th fail brings the running total to 5 fails, so the 5th batch call already sees `v_recent_fails >= 5` and short-circuits unlogged). The final standalone locked-out call in Step 4 is also unlogged for the same reason.

- [ ] **Step 6: Clean up the test PIN and test log rows**

```sql
delete from public.az_gate_access_log where tool = 'test-tool';
delete from public.az_gate_pins where label = '__TEST__';
```

---

### Task 5: Vendor the Supabase JS client

**Files:**
- Create: `assets/supabase.min.js`

- [ ] **Step 1: Download the UMD build (user already approved this exact command/version)**

Run:
```bash
curl -sL -o assets/supabase.min.js https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.2/dist/umd/supabase.js
```

- [ ] **Step 2: Verify it downloaded correctly and exposes `window.supabase`**

Run:
```bash
head -c 60 assets/supabase.min.js && echo "" && wc -c assets/supabase.min.js
```
Expected: output starts with `var supabase=` and the file is roughly 200KB (not an HTML error page).

- [ ] **Step 3: Commit**

```bash
git add assets/supabase.min.js
git commit -m "feat(pin-gate): vendor supabase-js UMD build for server-verified PIN check"
```

---

### Task 6: Update `pin-gate.config.js` — drop the PIN list, add Supabase config

**Files:**
- Modify: `assets/pin-gate.config.js`

- [ ] **Step 1: Replace the file contents**

```javascript
/* Advisortool — PIN gate configuration. แก้ค่าที่นี่ที่เดียว.
   หมายเหตุ: PIN ตรวจสอบฝั่งเซิร์ฟเวอร์ผ่าน Supabase (az_gate_verify RPC) แล้ว —
   ไฟล์นี้ไม่มีรายการ PIN อีกต่อไป เพิ่ม/ปิดรหัสได้ที่ตาราง az_gate_pins ใน Supabase เท่านั้น. */
window.PIN_GATE_CONFIG = {
  supabaseUrl: 'https://yovibeztstpexajpuyyb.supabase.co',
  supabaseAnonKey: 'sb_publishable_8LnqhRHZKBTI9qUueCahPA_lKEMNc0K',
  storageKey: 'az_gate',                // key ใน localStorage
  idleTimeoutMs: 12 * 60 * 60 * 1000,   // ไม่ใช้งานเกิน 12 ชม. → ล็อกใหม่ (sliding)
  maxAttempts: 5,                       // ใส่ผิดกี่ครั้งถึงล็อกชั่วคราว (ฝั่ง UI; เซิร์ฟเวอร์ก็บังคับเองด้วย)
  lockoutSeconds: 30,                   // ล็อกนานเท่าไร (วินาที)
  title: 'กรุณาใส่รหัสผ่าน',
  subtitle: 'Advisortool'
};
```

- [ ] **Step 2: Verify no `pins` array remains**

```bash
grep -n "pins" assets/pin-gate.config.js
```
Expected: no output (no match).

- [ ] **Step 3: Commit**

```bash
git add assets/pin-gate.config.js
git commit -m "feat(pin-gate): replace client-side PIN list with Supabase config"
```

---

### Task 7: Update `pin-gate.js` — verify via Supabase RPC instead of a local array

**Files:**
- Modify: `assets/pin-gate.js`

- [ ] **Step 1: Replace the file contents in full**

```javascript
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
```

- [ ] **Step 2: Verify no reference to a local PIN list remains**

```bash
grep -n "PINS\b" assets/pin-gate.js
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add assets/pin-gate.js
git commit -m "feat(pin-gate): verify PIN via Supabase RPC instead of a client-side list"
```

---

### Task 8: Load `supabase.min.js` on all 14 tool pages, before `pin-gate.js`

**Files (all get the same one-line insertion, immediately before their existing `pin-gate.js` `<script>` tag):**
- `index.html` (root — uses `assets/` prefix)
- `lifeready/index.html`, `pension-smart95/index.html`, `fhc/index.html`, `agency/index.html`, `agency/bonus-calculator.html`, `agency/calculator.html`, `agency/manager-test.html`, `global-saving/index.html`, `ishield/index.html`, `ihealthy/index.html`, `career-agent/index.html`, `ci123/index.html`, `group-insurance/index.html` (all use `../assets/` prefix)

- [ ] **Step 1: Insert the script tag in the root page**

```bash
perl -0pi -e 's{(<script src="assets/pin-gate\.config\.js"></script>\n)(\s*<script src="assets/pin-gate\.js"></script>)}{$1  <script src="assets/supabase.min.js"></script>\n$2}' index.html
```

- [ ] **Step 2: Insert the script tag in the other 13 pages**

```bash
for f in lifeready/index.html pension-smart95/index.html fhc/index.html \
  agency/index.html agency/bonus-calculator.html agency/calculator.html agency/manager-test.html \
  global-saving/index.html ishield/index.html ihealthy/index.html career-agent/index.html \
  ci123/index.html group-insurance/index.html; do
  perl -0pi -e 's{(<script src="\.\./assets/pin-gate\.config\.js"></script>\n)(\s*<script src="\.\./assets/pin-gate\.js"></script>)}{$1  <script src="../assets/supabase.min.js"></script>\n$2}' "$f"
done
```

- [ ] **Step 3: Verify all 14 pages now load `supabase.min.js` before `pin-gate.js`**

```bash
grep -L "supabase.min.js" index.html lifeready/index.html pension-smart95/index.html fhc/index.html \
  agency/index.html agency/bonus-calculator.html agency/calculator.html agency/manager-test.html \
  global-saving/index.html ishield/index.html ihealthy/index.html career-agent/index.html \
  ci123/index.html group-insurance/index.html
```
Expected: no output (every file matched, so `grep -L` — which prints files *without* a match — prints nothing).

```bash
grep -A1 "pin-gate.config.js" ihealthy/index.html
```
Expected:
```
  <script src="../assets/pin-gate.config.js"></script>
  <script src="../assets/supabase.min.js"></script>
  <script src="../assets/pin-gate.js"></script>
```

- [ ] **Step 4: Commit**

```bash
git add index.html lifeready/index.html pension-smart95/index.html fhc/index.html \
  agency/index.html agency/bonus-calculator.html agency/calculator.html agency/manager-test.html \
  global-saving/index.html ishield/index.html ihealthy/index.html career-agent/index.html \
  ci123/index.html group-insurance/index.html
git commit -m "feat(pin-gate): load supabase.min.js on all 14 gated pages"
```

---

### Task 9: End-to-end verification against the local dev server

**Files:** none (verification only).

- [ ] **Step 1: Insert a throwaway test PIN for this browser check**

Call `execute_sql` on project `yovibeztstpexajpuyyb` (same disposable test PIN convention as Task 4 — never a real production PIN):
```sql
insert into public.az_gate_pins (label, pin_hash) values ('__TEST_E2E__', extensions.crypt('999999', extensions.gen_salt('bf')));
```

- [ ] **Step 2: Start the local static server**

```bash
python3 -m http.server 8080
```
(Run in background; confirm with `curl -sf http://localhost:8080/ >/dev/null && echo OK`.)

- [ ] **Step 3: Correct (test) PIN unlocks the page**

Using a Playwright script (same pattern as prior print-layout verification in this session): navigate to `http://localhost:8080/ihealthy/index.html`, click digits `9`,`9`,`9`,`9`,`9`,`9` on the keypad, wait ~1s for the RPC round trip, and screenshot. Expected: the PIN overlay closes and the iHealthy page content is visible (same as before this change).

- [ ] **Step 4: Wrong PIN shows an error and does not unlock**

Reload the page fresh (new context / cleared localStorage) and run the same script with digits `000000`. Expected: overlay stays, shake animation fires, message shows "รหัสไม่ถูกต้อง ลองใหม่".

- [ ] **Step 5: Confirm both attempts landed in the access log**

Call `execute_sql` on project `yovibeztstpexajpuyyb`:
```sql
select label_snapshot, tool, success, created_at
from public.az_gate_access_log
where tool = 'ihealthy'
order by created_at desc
limit 5;
```
Expected: the most recent 2 rows are `success = true` (the correct test PIN) and `success = false` (the wrong one), both with `tool = 'ihealthy'`.

- [ ] **Step 6: Clean up the E2E test PIN**

```sql
delete from public.az_gate_pins where label = '__TEST_E2E__';
delete from public.az_gate_access_log where label_snapshot = '__TEST_E2E__';
```

- [ ] **Step 7: Stop the local dev server**

```bash
pkill -f "http.server 8080"
```

---

### Task 10: Push to production

- [ ] **Step 1: Confirm no divergence from `origin/main`**

```bash
git fetch git@github.com:pheerapatpisitdev/Advisortool.git main:refs/remotes/origin/main
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
```
If `HEAD..origin/main` shows any commits, rebase onto `origin/main` first (see `[[deploy-push-workflow]]` memory pattern) before continuing.

- [ ] **Step 2: Push**

```bash
git push git@github.com:pheerapatpisitdev/Advisortool.git HEAD:main
```

- [ ] **Step 3: Tell the user**

Report: deploy takes ~1-2 min, then hard-refresh any already-open tool page (old `pin-gate.js`/`config.js` may be cached). Remind them the 8 PIN labels are still placeholders (`PIN 1`..`PIN 8`) — rename via the Supabase Table Editor (`az_gate_pins` table, project 83G30M) whenever convenient.

---

## Self-review notes

- **Spec coverage:** Problem/Goals 1–4 → Tasks 1–4 (server-verified RPC + lockout) and Task 3 (per-attempt log via the RPC's insert). Data model → Task 1. RPC → Task 2. Client changes → Tasks 5–8. Migration → Task 3. Trade-offs (network required, no auto-sync) are inherent to the design, not additional tasks — called out to the user in Task 10 Step 3 and already accepted in the spec.
- **Placeholder scan:** No TBD/TODO; every step has runnable SQL, bash, or full file contents.
- **Type consistency:** `az_gate_verify(input_pin text, input_tool text, input_ua text)` signature matches the client's `client.rpc('az_gate_verify', { input_pin, input_tool, input_ua })` call exactly (same three param names). `{ok, locked}` response shape matches what `pin-gate.js` reads (`data.ok`, `data.locked`).
