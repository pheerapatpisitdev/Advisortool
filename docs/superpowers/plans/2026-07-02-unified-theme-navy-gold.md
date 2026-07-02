# Unified Navy & Gold Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give LifeReady, บำนาญ สมาร์ท 95, and iShield one shared "Navy & Gold" look (colors, IBM Plex Sans Thai font, and the same header / card / steps / button / KPI / table patterns) so the three calculators read as one product family.

**Architecture:** One shared stylesheet `assets/theme.css` holds all design tokens and component classes (all prefixed `.az-` to avoid clashing with each tool's legacy CSS). Every tool `<link>`s it after `assets/global-header.css`, adds `class="az-theme"` to `<body>`, and switches its markup to the `.az-*` component classes. No calculation code (`engine.js` / premium math / rounding) is touched anywhere.

**Tech Stack:** Vanilla HTML/CSS/JS, no framework, no bundler. บำนาญ 95 has a Node build step (`npm run build:all`) that must keep passing `npm run verify`.

**Reference spec:** `docs/superpowers/specs/2026-07-02-unified-theme-navy-gold-design.md`

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `assets/theme.css` | Shared design tokens + `.az-*` component classes + shared `@media print` | **Create** |
| `pension-smart95/index.html` | Entry markup → `.az-*` classes, `<body class="az-theme">`, remove sticky hack | Modify |
| `pension-smart95/src/styles.css` | Drop rules now owned by theme.css; keep tool-specific (steps legacy, collapse, tax-grid, rider, prem-tbl) | Modify |
| `pension-smart95/src/app.js` | Rename generated structural classes to `.az-*` | Modify |
| `pension-smart95/scripts/build.mjs` | Inline `../assets/theme.css` + `global-header.*` into the single-file build | Modify |
| `pension-smart95/scripts/build_web.mjs` | Copy `../assets/theme.css` + `global-header.*` into `dist/web/assets/` and rewrite paths | Modify |
| `pension-smart95/CLAUDE.md` | Update the "Brand / Fonts" convention line | Modify |
| `lifeready/index.html` | New hero header, steps, `.az-*` cards, `<body class="az-theme">` | Modify |
| `lifeready/css/styles.css` | Drop rules owned by theme.css; keep cv-table / cv-chart / breakdown / benefit-tbl | Modify |
| `lifeready/js/app.js` | Rename generated structural classes; add KPI markup; recolor chart to navy/gold | Modify |
| `ishield/css/styles.css` | **Create** — the CSS currently embedded in `ishield/index.html`, minus what theme.css owns | Create |
| `ishield/index.html` | Remove `<style>` block → `<link>` styles.css + theme.css; new hero + steps + `.az-*`; drop inline `style=` | Modify |

---

## Shared conventions for every task

- **Serve for visual checks** (the app uses relative `../assets/...` paths, so `file://` works too, but a server matches production): from repo root run `python3 -m http.server 8000`, then open the tool URL noted in each task. Stop it with Ctrl-C when done.
- **Cache-bust:** every tool already versions its own CSS with `?v=NN`. When you add the `theme.css` link, use `?v=1`; bump it if you edit theme.css later. Also bump the tool's own `styles.css?v=` and `app.js?v=` when you edit them, so the browser reloads.
- **Never touch calculation code:** `pension-smart95/src/engine.js`, `lifeready/js/engine.js`, `lifeready/js/data.js`, and any premium/rounding logic. This plan only changes presentation (HTML classes, CSS, and the DOM-building strings in `app.js`).
- **Commit after each task** with the exact message given.

---

## Task 1: Create the shared theme stylesheet

**Files:**
- Create: `assets/theme.css`

- [ ] **Step 1: Write `assets/theme.css` with the full content below**

```css
/* Advisortool — shared theme "Navy & Gold".
   Loaded AFTER assets/global-header.css. All classes are prefixed .az- so they
   never collide with each tool's legacy CSS during migration.
   Activate on a page by adding class="az-theme" to <body>. */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap');

:root{
  --az-navy:#0d2c54; --az-navy-2:#143b6e;
  --az-gold:#c79a3a; --az-gold-l:#f7efdd; --az-gold-d:#a97f28;
  --az-teal:#0a7d8c; --az-teal-l:#e6f4f6; --az-teal-d:#086876;
  --az-bg:#f4f6f9; --az-card:#ffffff; --az-line:#e2e8f0; --az-soft:#eef3f8;
  --az-ink:#1f2937; --az-muted:#64748b;
  --az-good:#0f8a4d; --az-good-l:#e7f6ee;
  --az-bad:#c0392b; --az-bad-l:#fdecea;
  --az-radius:14px; --az-radius-s:9px;
  --az-shadow:0 1px 3px rgba(16,42,76,.08),0 1px 2px rgba(16,42,76,.06);
  --az-font:'IBM Plex Sans Thai','Sarabun','Segoe UI',Tahoma,sans-serif;
}

/* base (scoped to the class so it never restyles pages that don't opt in) */
.az-theme{ font-family:var(--az-font); background:var(--az-bg); color:var(--az-ink); font-size:15px; line-height:1.5; -webkit-text-size-adjust:100%; }
.az-theme *{ box-sizing:border-box; }
.az-wrap{ max-width:1180px; margin:0 auto; padding:0 16px 80px; }
.az-wrap.az-narrow{ max-width:860px; }

/* product hero header (non-sticky) */
.az-hero{ background:linear-gradient(120deg,var(--az-navy),var(--az-navy-2)); color:#fff; box-shadow:var(--az-shadow); }
.az-hero__in{ max-width:1180px; margin:0 auto; padding:20px 16px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.az-hero__brand{ display:flex; align-items:center; gap:13px; }
.az-hero__logo{ width:46px; height:46px; border-radius:12px; background:var(--az-gold); color:var(--az-navy); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:19px; letter-spacing:-.5px; flex:none; }
.az-hero__ttl{ font-size:21px; font-weight:700; line-height:1.15; }
.az-hero__sub{ font-size:13px; opacity:.82; margin-top:2px; }
.az-hero__badge{ text-align:right; border:1px solid var(--az-gold); background:rgba(199,154,58,.16); border-radius:10px; padding:7px 14px; font-size:12.5px; }
.az-hero__badge b{ display:block; font-size:13.5px; }

/* steps indicator */
.az-steps{ display:flex; align-items:center; gap:8px; justify-content:center; margin:20px 0 4px; }
.az-steps .az-s{ display:flex; align-items:center; gap:8px; font-size:13px; color:var(--az-muted); font-weight:500; }
.az-steps .az-s .az-n{ width:24px; height:24px; border-radius:50%; background:#fff; border:1.5px solid var(--az-line); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:var(--az-muted); }
.az-steps .az-s.az-active{ color:var(--az-navy); }
.az-steps .az-s.az-active .az-n{ background:var(--az-navy); border-color:var(--az-navy); color:#fff; }
.az-steps .az-bar{ width:46px; height:2px; background:var(--az-line); border-radius:2px; }
.az-steps .az-bar.az-done{ background:var(--az-navy); }

/* card */
.az-card{ background:var(--az-card); border:1px solid var(--az-line); border-radius:var(--az-radius); box-shadow:var(--az-shadow); margin-bottom:16px; overflow:hidden; }
.az-card__h{ padding:13px 18px; border-bottom:1px solid var(--az-line); display:flex; align-items:center; gap:10px; background:linear-gradient(0deg,#fbfcfe,#fff); }
.az-card__n{ width:26px; height:26px; border-radius:8px; background:var(--az-gold-l); color:var(--az-gold-d); display:flex; align-items:center; justify-content:center; font-size:13.5px; font-weight:700; flex:none; }
.az-card__h h2{ font-size:15.5px; font-weight:600; color:var(--az-navy); margin:0; }
.az-card__tag{ margin-left:auto; font-size:11px; color:var(--az-muted); background:var(--az-soft); padding:2px 10px; border-radius:20px; white-space:nowrap; }
.az-card__b{ padding:16px 18px; }

/* form layout + controls */
.az-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:0 18px; align-items:start; }
.az-field{ margin-bottom:13px; } .az-field:last-child{ margin-bottom:0; }
.az-field > label{ display:block; font-size:13px; font-weight:500; color:var(--az-muted); margin-bottom:5px; }
.az-theme input[type=text],.az-theme input[type=number],.az-theme select{ width:100%; padding:10px 11px; border:1px solid var(--az-line); border-radius:var(--az-radius-s); font-family:inherit; font-size:16px; background:#fff; color:var(--az-ink); transition:border .15s,box-shadow .15s; }
.az-theme input:focus,.az-theme select:focus{ outline:none; border-color:var(--az-teal); box-shadow:0 0 0 3px rgba(10,125,140,.14); }
.az-theme input[type=number]{ text-align:right; }
.az-seg{ display:flex; background:var(--az-soft); border-radius:var(--az-radius-s); padding:3px; gap:3px; }
.az-seg button{ flex:1; border:0; background:transparent; min-height:40px; padding:8px 6px; border-radius:7px; font-family:inherit; font-size:13.5px; color:var(--az-muted); cursor:pointer; font-weight:500; transition:.15s; }
.az-seg button.on{ background:#fff; color:var(--az-navy); box-shadow:0 1px 4px rgba(0,0,0,.08); font-weight:600; }
.az-seg button:disabled{ opacity:.35; cursor:not-allowed; }
.az-hint{ font-size:12px; color:var(--az-muted); margin-top:5px; }
.az-err{ font-size:12.5px; color:var(--az-bad); margin-top:5px; font-weight:500; }

/* buttons */
.az-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:11px 18px; border-radius:10px; border:0; font-family:inherit; font-weight:600; font-size:14.5px; cursor:pointer; transition:.15s; }
.az-btn-calc{ width:100%; padding:15px; border-radius:13px; background:linear-gradient(120deg,var(--az-teal),var(--az-teal-d)); color:#fff; font-size:17px; box-shadow:0 6px 18px rgba(10,125,140,.32); }
.az-btn-calc:hover{ transform:translateY(-1px); box-shadow:0 9px 24px rgba(10,125,140,.42); }
.az-btn-calc:active{ transform:translateY(0); }
.az-btn-back{ background:var(--az-navy); color:#fff; }
.az-btn-back:hover{ background:var(--az-navy-2); }
.az-btn-ghost{ background:#fff; color:var(--az-navy); border:1px solid var(--az-line); box-shadow:var(--az-shadow); }
.az-btn-ghost:hover{ background:var(--az-soft); }

/* KPI summary */
.az-kpi{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.az-kpi .az-box{ background:linear-gradient(135deg,var(--az-soft),#fff); border:1px solid var(--az-line); border-radius:12px; padding:14px; }
.az-kpi .az-box.az-hero-box{ grid-column:1/-1; background:linear-gradient(135deg,var(--az-navy),var(--az-navy-2)); border:0; color:#fff; }
.az-kpi .az-lbl{ font-size:12.5px; color:var(--az-muted); margin-bottom:3px; }
.az-kpi .az-box.az-hero-box .az-lbl{ color:rgba(255,255,255,.82); }
.az-kpi .az-val{ font-size:25px; font-weight:700; color:var(--az-navy); line-height:1.1; font-variant-numeric:tabular-nums; }
.az-kpi .az-box.az-hero-box .az-val{ color:#fff; font-size:30px; }
.az-kpi .az-sub{ font-size:12px; color:var(--az-muted); margin-top:4px; }
.az-kpi .az-box.az-hero-box .az-sub{ color:rgba(255,255,255,.85); }

/* tables */
.az-table{ width:100%; border-collapse:collapse; font-size:13.5px; font-variant-numeric:tabular-nums; }
.az-table th,.az-table td{ padding:8px 10px; text-align:right; border-bottom:1px solid var(--az-line); border-right:1px solid var(--az-line); }
.az-table th:first-child,.az-table td:first-child{ text-align:left; }
.az-table th:last-child,.az-table td:last-child{ border-right:none; }
.az-table thead th{ background:var(--az-navy); color:#fff; font-weight:600; font-size:12.5px; border-right-color:rgba(255,255,255,.18); }
.az-table tbody tr:nth-child(even) td{ background:#f8fafc; }
.az-table tbody tr:hover td{ background:var(--az-teal-l); }
.az-table tfoot td,.az-table tr.az-total td{ font-weight:700; color:var(--az-navy); background:var(--az-gold-l); border-top:2px solid var(--az-gold); }

/* misc */
.az-note{ background:var(--az-soft); border-left:3px solid var(--az-gold); padding:10px 13px; border-radius:0 8px 8px 0; font-size:12.5px; color:var(--az-muted); margin-top:12px; }
.az-warn{ background:var(--az-bad-l); color:var(--az-bad); border:1px solid #f3c1bb; padding:9px 12px; border-radius:9px; font-size:13px; margin-bottom:12px; }
.az-pill{ display:inline-block; font-size:11px; padding:3px 10px; border-radius:20px; background:var(--az-teal-l); color:var(--az-teal-d); font-weight:600; }
.az-disclaimer{ font-size:11.5px; color:var(--az-muted); text-align:center; margin:24px auto 0; line-height:1.6; max-width:920px; }
.az-view{ display:none; } .az-view.az-active{ display:block; animation:az-fade .25s ease; }
@keyframes az-fade{ from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:none;} }

@media(max-width:760px){ .az-grid2{ grid-template-columns:1fr; } .az-kpi{ grid-template-columns:1fr; } }
@media(max-width:640px){
  .az-theme input,.az-theme select,.az-seg button{ font-size:16px; min-height:44px; }
  .az-btn,.az-btn-calc,.az-btn-back,.az-btn-ghost{ min-height:44px; }
}

/* keyboard focus */
.az-seg button:focus-visible,.az-btn:focus-visible,.az-btn-calc:focus-visible,.az-btn-back:focus-visible,.az-btn-ghost:focus-visible{ outline:3px solid var(--az-teal); outline-offset:2px; }

/* print — shared base; each tool may add its own page-break rules on top */
@media print{
  .az-gh,.az-hero__badge,.az-steps,.az-btn,.az-btn-calc,.az-btn-back,.az-btn-ghost{ display:none !important; }
  .az-theme{ background:#fff; font-size:12px; }
  .az-card{ box-shadow:none; border:1px solid #ccc; break-inside:avoid; }
  .az-grid2{ grid-template-columns:1fr; }
}
```

- [ ] **Step 2: Sanity-check the file parses (no stray braces)**

Run: `node -e "const c=require('fs').readFileSync('assets/theme.css','utf8'); const o=(c.match(/{/g)||[]).length, cl=(c.match(/}/g)||[]).length; if(o!==cl){console.error('brace mismatch',o,cl);process.exit(1)} console.log('braces ok',o)"`
Expected: `braces ok 61` (any equal count is fine; must not print "brace mismatch").

- [ ] **Step 3: Commit**

```bash
git add assets/theme.css
git commit -m "feat(theme): add shared Navy & Gold design system (assets/theme.css)"
```

---

## Task 2: บำนาญ สมาร์ท 95 (pilot — recolor + adopt theme.css, keep verify green)

This tool already has the target layout (steps/cards/KPI). The work is: swap to `.az-*` classes, drop the now-duplicated rules from `src/styles.css`, remove the sticky-header hack, recolor to navy/gold via theme.css, and make the build inline the shared assets.

**Files:**
- Modify: `pension-smart95/index.html`
- Modify: `pension-smart95/src/styles.css`
- Modify: `pension-smart95/src/app.js`
- Modify: `pension-smart95/scripts/build.mjs`
- Modify: `pension-smart95/scripts/build_web.mjs`
- Modify: `pension-smart95/CLAUDE.md`

- [ ] **Step 1: Run the engine test to capture the green baseline (must stay green all task)**

Run: `cd pension-smart95 && npm run verify`
Expected: verify prints its pass summary and exits 0. Note it — it must still pass at Step 12.

- [ ] **Step 2: Link theme.css and remove the sticky-offset hack in `pension-smart95/index.html`**

Replace this block (lines ~9–16):

```html
<link rel="stylesheet" href="src/styles.css">
<link rel="stylesheet" href="../assets/global-header.css" />
<style>
  /* This page's own <header> is position:sticky;top:0 — offset it below the shared
     global header so the two sticky bars don't overlap on scroll. Scoped with
     :not(.az-gh) so it never touches the global header itself. */
  body > header:not(.az-gh) { top: var(--az-header-h, 64px) !important; }
</style>
```

with:

```html
<link rel="stylesheet" href="../assets/global-header.css" />
<link rel="stylesheet" href="../assets/theme.css?v=1" />
<link rel="stylesheet" href="src/styles.css?v=2">
```

- [ ] **Step 3: Add `az-theme` to `<body>` and convert the header + steps markup in `pension-smart95/index.html`**

Change `<body>` to `<body class="az-theme">`.

Replace the `<header>…</header>` block (lines ~20–25):

```html
<header>
  <div class="hd">
    <div class="brand"><span class="logo">95</span><span>บำนาญ สมาร์ท 95<small>โปรแกรมคำนวณเบี้ยประกันภัย &amp; ผลประโยชน์</small></span></div>
    <div class="ver"><b id="verName">บำนาญแบบลดหย่อนภาษีได้</b><span>เวอร์ชั่น A2026-1</span></div>
  </div>
</header>
```

with:

```html
<header class="az-hero">
  <div class="az-hero__in">
    <div class="az-hero__brand">
      <span class="az-hero__logo">95</span>
      <span><span class="az-hero__ttl">บำนาญ สมาร์ท 95</span><span class="az-hero__sub">โปรแกรมคำนวณเบี้ยประกันภัย &amp; ผลประโยชน์</span></span>
    </div>
    <div class="az-hero__badge"><b id="verName">บำนาญแบบลดหย่อนภาษีได้</b>เวอร์ชั่น A2026-1</div>
  </div>
</header>
```

Then wrap the page body content in `.az-wrap` (change `<div class="wrap">` to `<div class="az-wrap">`).

Replace the steps block (lines ~28–32):

```html
  <div class="steps">
    <div class="s active" id="stepA"><span class="n">1</span> กรอกข้อมูล</div>
    <div class="bar" id="stepBar"></div>
    <div class="s" id="stepB"><span class="n">2</span> ผลการคำนวณ</div>
  </div>
```

with:

```html
  <div class="az-steps">
    <div class="az-s az-active" id="stepA"><span class="az-n">1</span> กรอกข้อมูล</div>
    <div class="az-bar" id="stepBar"></div>
    <div class="az-s" id="stepB"><span class="az-n">2</span> ผลการคำนวณ</div>
  </div>
```

- [ ] **Step 4: Convert the remaining static markup classes in `pension-smart95/index.html`**

Apply these exact class renames throughout the file (static markup only — the `id`s stay the same):

| Old | New |
|---|---|
| `class="view active" id="viewInput"` | `class="az-view az-active" id="viewInput"` |
| `class="view" id="viewResult"` | `class="az-view" id="viewResult"` |
| `class="grid2"` | `class="az-grid2"` |
| `class="card"` (and `card collapse open`) | `class="az-card"` (keep extra words: `az-card collapse open`) |
| `class="card-h"` | `class="az-card__h"` |
| `<span class="ic">👤</span>` etc. (the emoji spans in card headers) | `<span class="az-card__n">1</span>` … number them 1,2,3,4 top-to-bottom; delete the emoji |
| `class="step"` (the pill in card-h / used as `id="planStep"`, `id="modeStep"`) | `class="az-card__tag"` |
| `class="card-b"` | `class="az-card__b"` |
| `class="field"` | `class="az-field"` |
| `class="row2"` | `class="az-grid2"` |
| `class="seg"` | `class="az-seg"` |
| `class="hint"` | `class="az-hint"` |
| `class="err"` | `class="az-err"` |
| `class="calc-bar"` | keep as-is (tool-specific sticky bar — see Step 6) |
| `class="btn-calc"` | `class="az-btn-calc"` |
| `class="calc-err"` | keep as-is (tool-specific) |
| `class="resbar"` | keep as-is (tool-specific layout) |
| `class="btn btn-back"` | `class="az-btn az-btn-back"` |
| `class="btn btn-ghost"` | `class="az-btn az-btn-ghost"` |
| `class="res-summary"` | keep as-is (tool-specific) |
| `class="kpi"` | `class="az-kpi"` |
| `class="box hero"` | `class="az-box az-hero-box"` |
| `class="box"` | `class="az-box"` |
| `class="lbl"` | `class="az-lbl"` |
| `class="val"` | `class="az-val"` |
| `class="sub"` | `class="az-sub"` |
| `class="disclaimer"` | `class="az-disclaimer"` |
| `class="note"` (id `illusNote`, `txNote` stay) | `class="az-note"` |

Leave these tool-specific classes untouched (styled by `styles.css`, Step 5 keeps them): `prem-tbl`, `collapse`, `collapse-h`, `collapse-b`, `arr`, `riders-grid`, `tbl-scroll`, `tax-grid`, `tax-out`, `big`, `annu-band`, `pill`, `hint` inside tax section already renamed above — for any `class="hint"` inside `tax-out`, also rename to `az-hint`.

- [ ] **Step 5: Trim `pension-smart95/src/styles.css` to only tool-specific rules**

Delete these rule blocks (now provided by theme.css) — match by leading selector:
`:root{…}`, `*{box-sizing…}`, `body{…}`, `.wrap{…}`, `h1,h2,h3,.brand`, `header{…}`, `.hd`, `.brand`, `.brand .logo`, `.brand small`, `.hd .ver`, `.hd .ver b`, all `.steps …`, `.card{…}`, `.card-h …`, `.card-b`, `.field …`, `label{…}`, `input…/select` + focus, `.row2`, all `.seg …`, `.hint`, `.err`, `.calc-err`, `.grid2`, `.btn{…}`, `.btn-back`, `.btn-ghost`, all `.kpi …`, generic `table/th/td/thead/tbody` (KEEP the `.prem-tbl …` rules), `.note`, `.disclaimer`, `.view/.view.active`, `@keyframes fade`.

Keep (tool-specific): `.rider …`, `.riders-grid`, `.calc-bar` (sticky bottom bar), `.btn-calc` override? — **delete** `.btn-calc` (theme owns it), `.resbar`, `.res-summary`, `.pill`, `.prem-tbl …`, `.tbl-scroll`, `.annu-band`, `.collapse* / .arr`, `.tax-grid`, `.tax-out`, `.note` is deleted (theme owns) so keep tax-out's own border, `@media(max-width:560px)` (keep but drop `.kpi`/`.row2` lines already handled — leaving them is harmless), and the `@media print` block **but** update it to the `.az-*` selectors:

Replace the existing print block:

```css
@media print{
  header,.az-gh,.steps,.resbar,.calc-bar{display:none!important}
  #viewInput{display:none!important}
  .grid2{grid-template-columns:1fr}body{background:#fff;font-size:12px}
  .card{box-shadow:none;border:1px solid #ccc;break-inside:avoid}
  .tbl-scroll{max-height:none;overflow:visible}.collapse-b{display:block!important}
}
```

with (tool-specific extras only; base print rules live in theme.css):

```css
@media print{
  .resbar,.calc-bar{display:none!important}
  #viewInput{display:none!important}
  .tbl-scroll{max-height:none;overflow:visible}.collapse-b{display:block!important}
}
```

Keep the `.calc-bar`, `.btn-calc` linter note: the CTA `az-btn-calc` still needs to live inside `.calc-bar`; leave `.calc-bar` styling, it wraps the button fine.

- [ ] **Step 6: Rename structural classes emitted by `pension-smart95/src/app.js`**

`app.js` builds result markup as HTML strings. Update only the structural/theme classes it emits so they match Step 4. Search the file for each and rename:

- Segmented controls it rebuilds: any emitted `class="seg"` → `class="az-seg"`; the option buttons keep `class="on"` toggling (theme styles `.az-seg button.on`).
- Any emitted `class="field"` → `class="az-field"`, `class="hint"` → `class="az-hint"`, `class="err"` → `class="az-err"`.
- KPI updates: app.js sets text into `#kTotal` etc. by id — no class change needed there.
- The rider list (`#riderList`) uses `.rider*` classes styled by styles.css (kept) — **do not** rename those.

Run to find them: `grep -noE "class=\\\"(seg|field|hint|err)\\\"" pension-smart95/src/app.js` and rename each hit.

- [ ] **Step 7: Serve and visually verify the input + result pages**

Run: `cd .. && python3 -m http.server 8000` (from repo root), open `http://localhost:8000/pension-smart95/`.
Expected: navy gradient header with gold "95" logo; steps bar navy; cards have gold number chips; inputs/segments styled; click "คำนวณผลประโยชน์" → result page shows navy hero KPI, tables with navy headers + gold total row. Header scrolls away (not sticky). No visual overlap with the global header. Stop the server.

- [ ] **Step 8: Update `pension-smart95/scripts/build.mjs` to inline the shared assets**

The single-file build must inline `../assets/theme.css`, `../assets/global-header.css`, and `../assets/global-header.js` (currently they stay as broken `../assets/...` refs).

After the existing `const app = read('src/app.js');` line, add:

```js
const theme = read('../assets/theme.css');
const ghCss = read('../assets/global-header.css');
const ghJs  = read('../assets/global-header.js');
```

Replace the four existing `html = html.replace(...)` lines' region by adding these replacements (order: put global-header + theme styles before the tool styles). Insert before the `src/styles.css` replace:

```js
html = html.replace('<link rel="stylesheet" href="../assets/global-header.css" />', `<style>\n${ghCss}\n</style>`);
html = html.replace('<link rel="stylesheet" href="../assets/theme.css?v=1" />', `<style>\n${theme}\n</style>`);
html = html.replace(/<script src="..\/assets\/global-header.js[^"]*"><\/script>/, `<script>${ghJs}</script>`);
```

Update the existing tool-styles replace to include the `?v=2`:

```js
html = html.replace('<link rel="stylesheet" href="src/styles.css?v=2">', `<style>\n${css}\n</style>`);
```

Update the unresolved-ref guard array to also catch leftover asset refs:

```js
for (const ref of ['src/styles.css', 'data/db.js', 'src="src/engine.js"', 'src="src/app.js"', '../assets/theme.css', '../assets/global-header.css', '../assets/global-header.js']) {
```

Note: `@import` of the Google font stays inside the inlined theme `<style>` — that is fine for the single-file build (it fetches the font at open time).

- [ ] **Step 9: Update `pension-smart95/scripts/build_web.mjs` to copy the shared assets**

After the existing `copyFileSync(... 'data/db.js' ...)` line add:

```js
copyFileSync(join(root, '../assets/theme.css'), join(assets, 'theme.css'));
copyFileSync(join(root, '../assets/global-header.css'), join(assets, 'global-header.css'));
copyFileSync(join(root, '../assets/global-header.js'), join(assets, 'global-header.js'));
```

Extend the path-rewrite chain on `html`:

```js
let html = readFileSync(join(root, 'index.html'), 'utf8')
  .replace('href="src/styles.css?v=2"', 'href="assets/styles.css"')
  .replace('href="../assets/theme.css?v=1"', 'href="assets/theme.css"')
  .replace('href="../assets/global-header.css"', 'href="assets/global-header.css"')
  .replace(/src="..\/assets\/global-header.js[^"]*"/, 'src="assets/global-header.js"')
  .replace('src="data/db.js"', 'src="assets/db.js"')
  .replace('src="src/engine.js"', 'src="assets/engine.js"')
  .replace('src="src/app.js"', 'src="assets/app.js"');
```

- [ ] **Step 10: Run the full build and confirm no unresolved refs**

Run: `cd pension-smart95 && npm run build:all`
Expected: `npm run verify` passes, then `✓ single-file → dist/…` and `✓ static site → dist/web/…` with no `✗ build failed` line.

- [ ] **Step 11: Confirm the built single file has the theme inlined (not a broken link)**

Run: `grep -c "az-hero__logo\|--az-navy" "pension-smart95/dist/โปรแกรมคำนวณเบี้ย-บำนาญสมาร์ท95.html"`
Expected: a number ≥ 2 (theme CSS is inlined). Also: `grep -c "../assets/" "pension-smart95/dist/โปรแกรมคำนวณเบี้ย-บำนาญสมาร์ท95.html"` → expected `0`.

- [ ] **Step 12: Re-run verify to confirm calculations untouched**

Run: `cd pension-smart95 && npm run verify`
Expected: same green pass as Step 1.

- [ ] **Step 13: Update the brand convention line in `pension-smart95/CLAUDE.md`**

In the "## Conventions" section, replace:

```
- Thai-language UI. Brand: teal `#0f4c5c` + gold `#e09f3e`. Fonts: Prompt (headings) / Sarabun (body).
```

with:

```
- Thai-language UI. Brand: shared Navy & Gold theme in `../assets/theme.css` (navy `#0d2c54` + gold `#c79a3a`, teal `#0a7d8c` for actions). Font: IBM Plex Sans Thai. Prefer `.az-*` component classes; `src/styles.css` holds only tool-specific rules.
```

- [ ] **Step 14: Commit**

```bash
git add pension-smart95/index.html pension-smart95/src/styles.css pension-smart95/src/app.js pension-smart95/scripts/build.mjs pension-smart95/scripts/build_web.mjs pension-smart95/CLAUDE.md assets/theme.css
git commit -m "feat(pension-smart95): adopt shared Navy & Gold theme; inline shared assets in build"
```

---

## Task 3: LifeReady (recolor + adopt theme.css + add steps/KPI)

LifeReady already uses navy/teal/gold values that nearly match; the work is switching to the shared classes and the shared header/steps/card/KPI, and recoloring the cash-value chart accents to the shared tokens.

**Files:**
- Modify: `lifeready/index.html`
- Modify: `lifeready/css/styles.css`
- Modify: `lifeready/js/app.js`

- [ ] **Step 1: Link theme.css and add body class in `lifeready/index.html`**

Replace lines 12–13:

```html
<link rel="stylesheet" href="css/styles.css?v=16">
<link rel="stylesheet" href="../assets/global-header.css" />
```

with:

```html
<link rel="stylesheet" href="../assets/global-header.css" />
<link rel="stylesheet" href="../assets/theme.css?v=1" />
<link rel="stylesheet" href="css/styles.css?v=17">
```

Change `<body>` to `<body class="az-theme">`.

- [ ] **Step 2: Replace the header with the shared hero in `lifeready/index.html`**

Replace lines 18–21:

```html
<header><div class="wrap">
  <div><h1>โปรแกรมคำนวณเบี้ยประกันภัย</h1><div class="sub">ไลฟ์เรดดี้ (ไม่มีเงินปันผล) &middot; LifeReady (Non-Participating)</div></div>
  <div class="badge">เวอร์ชัน <b>A2026-1</b><br>ใช้ได้ถึง 31 มี.ค. 2570</div>
</div></header>
```

with:

```html
<header class="az-hero">
  <div class="az-hero__in">
    <div class="az-hero__brand">
      <span class="az-hero__logo">LR</span>
      <span><span class="az-hero__ttl">โปรแกรมคำนวณเบี้ยประกันภัย</span><span class="az-hero__sub">ไลฟ์เรดดี้ (ไม่มีเงินปันผล) &middot; LifeReady (Non-Participating)</span></span>
    </div>
    <div class="az-hero__badge"><b>เวอร์ชัน A2026-1</b>ใช้ได้ถึง 31 มี.ค. 2570</div>
  </div>
</header>

<div class="az-steps az-wrap az-narrow" id="lrSteps">
  <div class="az-s az-active" id="stepA"><span class="az-n">1</span> ข้อมูล &amp; แบบประกัน</div>
  <div class="az-bar" id="stepBar"></div>
  <div class="az-s" id="stepB"><span class="az-n">2</span> ผลการคำนวณ</div>
</div>
```

- [ ] **Step 3: Convert card + form classes in `lifeready/index.html`**

The page uses `.card` with an `<h2><span class="n">N</span> …</h2>` pattern. Convert each of the three input cards and the result cards to the shared card structure. For every card, change:

```html
<div class="card">
  <h2><span class="n">1</span> ข้อมูลผู้เอาประกันภัย</h2>
  … fields …
</div>
```

to:

```html
<div class="az-card">
  <div class="az-card__h"><span class="az-card__n">1</span><h2>ข้อมูลผู้เอาประกันภัย</h2></div>
  <div class="az-card__b">
    … fields …
  </div>
</div>
```

Do this for all cards (input cards 1–3 and each result `.card`; result cards that have `<h2>สรุปเบี้ยประกันภัย</h2>` etc. with no number get `<div class="az-card__h"><h2>…</h2></div>` — omit the `az-card__n` span when there was no number).

Field classes: `class="row"` → `class="az-grid2"` where it was two-up (rows with 2–3 `.f`), otherwise keep single; `class="f"` → `class="az-field"`; `.seg` → `.az-seg`; `.hint`/`.muted` used as helper text → `.az-hint`. The `#pbExtra` inline-styled row: keep its inline background but rename `f`→`az-field`.

Wrap page bodies: `<div class="wrap narrow" id="page-input">` → `<div class="az-wrap az-narrow" id="page-input">`; `<div class="wrap" id="page-result">` → `<div class="az-wrap" id="page-result">`; the inner `.grid` two-column result → `class="az-grid2"`.

- [ ] **Step 4: Convert the calc bar and result-head buttons in `lifeready/index.html`**

`class="calc-bar"` → keep (tool sticky bar), inner `class="btn-calc"` → `class="az-btn-calc"`.
`class="result-head"` → keep, its buttons: `class="btn btn-back"` → `class="az-btn az-btn-back"`, `class="btn btn-print"` → `class="az-btn az-btn-ghost"`.
`class="foot"` → `class="az-disclaimer"`.

- [ ] **Step 5: Add a KPI summary block to the result page in `lifeready/index.html`**

Immediately after `<div class="cust-strip" id="custStrip"></div>` (line ~67) insert:

```html
  <div class="az-kpi" id="lrKpi" style="margin-bottom:18px">
    <div class="az-box az-hero-box"><div class="az-lbl">เบี้ยประกันภัยรวม (งวดแรก)</div><div class="az-val" id="kTotal">—</div><div class="az-sub" id="kTotalSub"></div></div>
    <div class="az-box"><div class="az-lbl">ทุนประกันสัญญาหลัก</div><div class="az-val" id="kMainSA">—</div></div>
    <div class="az-box"><div class="az-lbl">เบี้ยสัญญาหลัก/งวด</div><div class="az-val" id="kMainPrem">—</div></div>
  </div>
```

- [ ] **Step 6: Populate the KPI values from `lifeready/js/app.js`**

Find where the result page is rendered (the function that fills `#bkBody`/`#bkFoot`, around the `goResult()` path). After it computes the totals it already displays in the breakdown footer, set the KPI text. Add, using the same already-computed values and the existing `fmt`/`fmt0` helpers (from `js/config.js`):

```js
// KPI summary (reuses values already computed for the breakdown)
const kT = document.getElementById('kTotal');
if (kT) {
  kT.textContent = fmt(grandTotalPerMode);           // same value shown in tfoot .grand
  document.getElementById('kTotalSub').textContent = STATE.mode || '';
  document.getElementById('kMainSA').textContent = fmt0(inp.mainSA) + ' บาท';
  document.getElementById('kMainPrem').textContent = fmt(mainPremPerMode);
}
```

If the exact variable names differ, use the values the breakdown footer renders (grand total for the mode, main SA, main premium per mode). Do not recompute premiums — read the numbers the render already has.

- [ ] **Step 7: Recolor the cash-value chart accents in `lifeready/js/app.js` / CSS**

The chart uses `--navy`, `--teal`, `--green`, `--gold` via `styles.css`. Since `styles.css` keeps its `:root` for now (Step 8 leaves chart vars), no JS color change is required — but verify the chart line/dot colors read from the CSS vars (they do, via `.cv-chart` classes). No code change unless a color is hard-coded as hex in `app.js`; if so, replace that hex with the matching `--az-*` value: navy `#0d2c54`, teal `#0a7d8c`, gold `#c79a3a`, green `#0f8a4d`.

Run to check for hard-coded chart hex: `grep -noE "#[0-9a-fA-F]{6}" lifeready/js/app.js` — for each hit in chart code, map to the nearest `--az-*` token value above.

- [ ] **Step 8: Trim `lifeready/css/styles.css`**

Keep the `@import` line? No — remove `@import url('…Sarabun…')` (theme.css now loads IBM Plex Sans Thai). Keep the `:root` block **but** it is now only used by the cv-table/cv-chart/breakdown/benefit rules; that is fine (harmless duplicate vars). Delete the rule blocks now owned by theme.css: `*{}`, `body{}`, `.wrap`, `header …`, `.grid` (replace usages with `.az-grid2` in markup — Step 3 — so delete `.grid`), `.card`, `.card h2 …`, `.row`, `.f …`, generic `input,select` + focus, `.seg …`, `.calc-bar` (KEEP — sticky bar), `.btn-calc` (DELETE — theme owns), `.result-head` (KEEP), `.btn`/`.btn-back`/`.btn-print` (DELETE — theme owns), `.hint`, `.muted` (KEEP `.muted`, still used), `.pill` (DELETE — theme owns), `.foot` (DELETE — became az-disclaimer).

Keep all of: `.cust-strip …`, `.breakdown …`, `.tabs …`, `.cv-wrap`, `.cv-table …`, `.cv-chart* …`, `.benefit-tbl …`, `.warn` (DELETE if replaced by `.az-warn` in markup; if `#warnBox` innerHTML uses `.warn`, keep it), the vertical-separator block, and the mobile `@media(max-width:640px)` block (KEEP).

Update the print block (line 141) to drop what theme.css now handles:

```css
@media print{header .badge,.result-head,.tabs{display:none}.cv-wrap{max-height:none;overflow:visible}}
```

- [ ] **Step 9: Rename structural classes emitted by `lifeready/js/app.js`**

`app.js` builds the rider table and breakdown as HTML strings using tool-specific classes (`rname`, `rdesc`, `rin`, `main`, `rn`, `rd`, `amt`, `pm`, `it`, `cat`, `warn`). These are styled by the KEPT rules in `styles.css` — **do not rename them.** Only rename any emitted generic `class="hint"`/`class="muted"` helper text you want on the theme: leave `muted` (kept), change emitted `class="hint"` → `class="az-hint"` if present. Run: `grep -noE "class=\\\"hint\\\"" lifeready/js/app.js` and rename hits.

- [ ] **Step 10: Serve and visually verify LifeReady**

Run: `python3 -m http.server 8000` (repo root), open `http://localhost:8000/lifeready/`.
Expected: navy hero header + gold "LR" logo; steps bar; three input cards with gold number chips + card body; segments/inputs themed; click "คำนวณเบี้ยประกัน" → result shows KPI row (navy hero box + two boxes with correct numbers matching the breakdown footer), breakdown + benefit tables navy headers, cash-value table + chart intact and correctly colored. Header non-sticky. Stop server.

- [ ] **Step 11: Cross-check numbers unchanged (engine untouched)**

Open the browser console on the result page and run the known-good check from `lifeready/CLAUDE.md`:
Run in console: `LR.calc(DATA, CV, {age:30,sex:'หญิง',mode:'รายปี',seq:4,mainSA:150000,occ:1}).main.mode`
Expected: `2025`.

- [ ] **Step 12: Commit**

```bash
git add lifeready/index.html lifeready/css/styles.css lifeready/js/app.js
git commit -m "feat(lifeready): adopt shared Navy & Gold theme (hero, steps, cards, KPI)"
```

---

## Task 4: iShield (extract embedded CSS + adopt theme.css)

iShield has ~120 lines of CSS embedded in a `<style>` block and 18 inline `style=` attributes. Move the CSS to `ishield/css/styles.css`, keep only tool-specific rules, link theme.css, and adopt the shared header/steps/card classes.

**Files:**
- Create: `ishield/css/styles.css`
- Modify: `ishield/index.html`

- [ ] **Step 1: Create `ishield/css/styles.css` with the tool-specific rules only**

Copy the current `<style>` contents (lines 10–126 of `ishield/index.html`) into the new file, then **remove** the blocks theme.css owns: `:root{}`, `*{}`, `body{}`, `.wrap`, `header.top …` (replaced by hero), generic `input…/select` + focus, `.seg …`, `.btn …` (theme owns; but iShield `.btn` is full-width primary — see note), `.card` + `.card h2 …` (replaced by az-card), `.kpi …` (replaced by az-kpi), `.sumgrid` (KEEP — layout), generic `.warn` (KEEP iShield's, it has `.show`/`.err` states the theme lacks), `.row2` (DELETE — theme owns).

Keep all iShield-unique rules: `.switch/.slider` (toggle), `table.tb …`, `table.vt …`, `.illus-wrap`, `.vt-wrap`, `.vtsection`, `.ci/.cibox …`, `.cinote …`, `details.dz …`, `.dzgrp/.dzh/.dzlist`, `.sech/.bar`, `.placeholder`, `.foot` (→ or rename to az-disclaimer in markup; if kept, keep rule), `.mini`, `.pillrow`, `.tag`, `.toolbar`, `.printhead`, `.navback`, `.subtle`, and BOTH iShield `@media print` blocks (page breaks for `.vtsection`, `ol.dzlist`, and the `#screenInput`/`.toolbar` hide — but drop lines theme.css now covers like `body{background:#fff}` duplication is harmless; keep the iShield-specific `table.tb th{position:static}`, `.printhead{display:block}`).

For iShield's primary `.btn` (full-width orange CTA): rename usages in markup to `az-btn-calc` (Step 3) and its `.btn.sec` (navy) to `az-btn az-btn-back`; then you may delete `.btn` rules. The `.resbar .btn` / `.toolbar .btn` width overrides: change those selectors to `.resbar .az-btn, .resbar .az-btn-back` and `.toolbar .az-btn-ghost` accordingly, or keep simple by giving the toolbar buttons `az-btn az-btn-ghost` and leaving width auto (default). Keep it minimal: toolbar/resbar buttons use `az-btn az-btn-ghost`.

- [ ] **Step 2: Replace the `<style>` block with stylesheet links in `ishield/index.html`**

Remove the entire `<style> … </style>` block (lines 9–127) and the standalone `<link rel="stylesheet" href="../assets/global-header.css" />` (line 128), replacing all of it with:

```html
<link rel="stylesheet" href="../assets/global-header.css" />
<link rel="stylesheet" href="../assets/theme.css?v=1" />
<link rel="stylesheet" href="css/styles.css?v=1" />
```

Change `<body>` to `<body class="az-theme">` (find the `<body>` tag ~line 130).

- [ ] **Step 3: Replace the header with the shared hero + add steps in `ishield/index.html`**

The current header is inside `.wrap` as `<header class="top">…</header>`. Move the hero OUT of `.wrap` so it spans full width. Replace:

```html
<div class="wrap">
  <header class="top">
    <div class="logo">iS</div>
    …
  </header>
```

with:

```html
<header class="az-hero">
  <div class="az-hero__in">
    <div class="az-hero__brand">
      <span class="az-hero__logo">iS</span>
      <span><span class="az-hero__ttl">โปรแกรมคำนวณเบี้ยประกัน iShield</span><span class="az-hero__sub">ประกันชีวิตควบโรคร้ายแรงตลอดชีพ</span></span>
    </div>
    <div class="az-hero__badge"><b>เวอร์ชัน A2026-1</b></div>
  </div>
</header>
<div class="az-wrap">
  <div class="az-steps az-narrow" id="isSteps" style="max-width:760px;margin-left:auto;margin-right:auto">
    <div class="az-s az-active" id="stepA"><span class="az-n">1</span> กรอกข้อมูล</div>
    <div class="az-bar" id="stepBar"></div>
    <div class="az-s" id="stepB"><span class="az-n">2</span> ผลการคำนวณ</div>
  </div>
```

(keep the original header's inner `<h1>`/`<p>` text if it differs from the above — use the real strings from the file). Ensure the closing `</div>` for `.wrap` still matches; the `.wrap` → `.az-wrap` rename means one wrap div wraps everything after the hero.

- [ ] **Step 4: Convert cards, controls, and KPI in `ishield/index.html`**

Class renames (static markup):

| Old | New |
|---|---|
| `class="card"` | `class="az-card"` — and move each card's `<h2>…</h2>` into `<div class="az-card__h">…</div>` and wrap the body in `<div class="az-card__b">`; the `<span class="dot"></span>` becomes `<span class="az-card__n">N</span>` numbered per card |
| `label class="fld"` / `.lab` | keep (tool-specific label layout) OR change to `az-field`; simplest: leave `label.fld` and add its rule to styles.css (keep it) |
| `class="row2"` | `class="az-grid2"` |
| `class="seg"` | `class="az-seg"` |
| `class="sumgrid"` | keep (styled in styles.css) |
| `class="kpi"` / `.kpi.hi` | `class="az-box"` / `class="az-box az-hero-box"` and inner `.t`→`.az-lbl`, `.v`→`.az-val`, `.u`→`.az-sub`; wrap the three in `<div class="az-kpi">` (replaces `.sumgrid` for the KPI row) |
| primary `class="btn"` (calc) | `class="az-btn-calc"` |
| `class="btn sec"` | `class="az-btn az-btn-back"` |
| `.resbar` buttons, `.toolbar` buttons | `class="az-btn az-btn-ghost"` |
| `class="foot"` | `class="az-disclaimer"` |
| tables `class="tb"` / `class="vt"` | keep (tool-specific) |

Leave untouched: `.switch/.slider`, `table.tb`, `table.vt`, `.ci/.cibox`, `.cinote`, `details.dz`, `.dzlist`, `.sech`, `.placeholder`, `.tag`, `.printhead`, `.warn`.

- [ ] **Step 5: Remove the 18 inline `style=` attributes in `ishield/index.html`**

Run: `grep -noE "style=\"[^\"]*\"" ishield/index.html` to list them. For each, move the declaration into a small tool-specific class in `css/styles.css` (name it by purpose, e.g. `.is-mt16{margin-top:16px}`) and reference the class instead — except the two structural ones added in Step 3 (`max-width`/`margin` on the steps) which may stay inline. Prefer reusing existing utilities; only add a class when a declaration repeats.

- [ ] **Step 6: Serve and visually verify iShield (both screens + print)**

Run: `python3 -m http.server 8000` (repo root), open `http://localhost:8000/ishield/`.
Expected: navy hero + gold "iS" logo; steps bar; input card themed with gold chips; toggles (`.switch`) still work; calculate → result shows KPI row (navy hero box), `table.tb` navy headers, the `.vt` illustration table intact, disease-list `details.dz` intact. Then File→Print (or Cmd-P): the input screen + buttons hidden, `.vtsection` starts on a new page, disease list prints in two columns. Stop server.

- [ ] **Step 7: Commit**

```bash
git add ishield/css/styles.css ishield/index.html
git commit -m "feat(ishield): extract CSS to file and adopt shared Navy & Gold theme"
```

---

## Task 5: Cross-tool QA + finish

**Files:** none (verification only), then a final polish commit if needed.

- [ ] **Step 1: Side-by-side consistency check (desktop)**

Run: `python3 -m http.server 8000` (repo root). Open all three in tabs:
`http://localhost:8000/lifeready/`, `http://localhost:8000/pension-smart95/`, `http://localhost:8000/ishield/`.
Expected: identical hero style, identical gold logo tile, identical steps bar, identical card header (gold chip + navy title), identical input/segment styling, identical button styling, identical navy table headers + gold total rows, same IBM Plex Sans Thai font. Note any drift.

- [ ] **Step 2: Responsive check (mobile + iPad widths)**

In the browser devtools, set width 390px (mobile) then 820px (iPad) for each tool.
Expected: 390px → cards single column, inputs ≥16px (no iOS zoom), 44px tap targets, `.az-grid2`/`.az-kpi` stack; 820px → two-column grids where defined. Global header from Hub still behaves (its own responsive rules at 520px). Note any overflow.

- [ ] **Step 3: Print/PDF check on all three**

Cmd-P (or File→Print → Save as PDF) on each tool's result page.
Expected: global header + buttons + steps hidden; white background; cards don't get clipped mid-row; iShield page-breaks (`.vtsection`) and two-column disease list correct; LifeReady cash-value table not clipped; pension illustration expanded (`.collapse-b` shown).

- [ ] **Step 4: Confirm the Hub still links and loads**

Open `http://localhost:8000/` and click into each of the three tools.
Expected: all three open and render themed; back navigation via the global header works. Stop server.

- [ ] **Step 5: Fix any drift found, then final commit (only if changes were made)**

If Steps 1–4 surfaced inconsistencies, fix them in `assets/theme.css` (shared) or the offending tool file, bump the relevant `?v=` query, re-verify, then:

```bash
git add -A
git commit -m "polish(theme): resolve cross-tool consistency + print/responsive nits"
```

- [ ] **Step 6: Re-run pension verify one last time (guard against accidental engine edits)**

Run: `cd pension-smart95 && npm run verify`
Expected: green pass.

---

## Self-Review notes (author check)

- **Spec coverage:** tokens (Task 1) ✓; hero/steps/card/form/button/KPI/table/print patterns (Task 1 classes, applied in Tasks 2–4) ✓; non-sticky header (Task 2 Step 2, hero has no sticky) ✓; gold chips replace emoji (Task 2 Step 4, Task 3 Step 3, Task 4 Step 4) ✓; IBM Plex Sans Thai (Task 1 `@import` + `--az-font`) ✓; build inlines shared assets (Task 2 Steps 8–11) ✓; keep `npm run verify` green (Task 2 Steps 1/12, Task 5 Step 6) ✓; iShield CSS extraction + inline-style removal (Task 4) ✓; iOS/print fixes preserved (Task 4 Step 1 keeps print blocks; theme print base in Task 1) ✓; CLAUDE.md brand note (Task 2 Step 13) ✓; responsive Hub behavior (Task 5 Step 2) ✓.
- **Placeholder scan:** KPI value wiring (Task 3 Step 6) names `grandTotalPerMode`/`mainPremPerMode` as the values-to-reuse with an explicit "if names differ, use the breakdown footer values" fallback — the executor must read the real variable names in `app.js`; this is a read-not-invent instruction, not a code placeholder.
- **Type/name consistency:** class names match between theme.css definitions and the per-tool rename tables (`az-hero__logo`, `az-card__n`, `az-box az-hero-box`, `az-btn-calc`, etc.).
