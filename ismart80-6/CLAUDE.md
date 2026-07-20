# CLAUDE.md — iSmart 80/6 (W80F06) Calculator

Dependency-free (HTML + CSS + vanilla JS) tool for **ไอสมาร์ท 80/6 (ไม่มีเงินปันผล)**,
version **A2026-1**: a whole-life-with-annual-cash-back product — pay 6 years, cover to age 80.
Premium (main + 13 riders), the benefit illustration table, and cash surrender values.

No build step for the page. Open `index.html` or serve (`npm run dev`, port 8080). Rate data is
embedded in `js/data.js` so it runs offline / from `file://`.

> ⚠️ Computes real insurance premiums. Do not change rounding/lookups in `js/engine.js` without
> re-running `node scripts/validate.mjs` (validated 1:1 vs the source workbook).

## Product (what makes it different from LifeReady)

- Pay **6 years**, cover to **age 80**, issue age **25–65**, SA min 150,000.
- **Annual cash-back (เงินจ่ายคืน):** 1% of SA years 1–5, 2% of SA year 6 → age 78.
- **Maturity (age 79/80):** 200% of SA.
- **Death benefit:** max(200% SA, 101% of premiums paid, cash surrender value).
- Cash-back options: take cash, or accumulate with the company at min 0.5%/yr.

## Load order (shared global scope)

`js/data.js` (window.DATA + window.CV) → `js/engine.js` (window.IS80) → `js/config.js`
(RIDERS, PLAN, STATE, `$`/`fmt`) → `js/app.js` (form/validate/render/print). All arithmetic is
in `engine.js`; `app.js` is presentation only.

## Engine (`js/engine.js`)

- `rd` = ROUNDDOWN/TRUNC, `rnd` = ROUND. Mode factors: รายปี ×1, 6เดือน ×0.52, 3เดือน ×0.27, เดือน ×0.09.
- **Main W80F06:** rate `DATA.mainRate['06'+g][age]` (per 1,000). `annual = rd(rate × rd(SA/1000,3), 2)`.
  **No high-SA discount on the main plan** (workbook `Cal!F13` = 0).
- **Benefit table:** cash-back rate 0.01/0.02/2.0; death = max(2×SA, 1.01×cumPrem, surrender);
  accumulate = cashback + 1.005×prev; surrender = round(TABCV factor × SA/1000).
- **Riders:** rate lookups are the **same A2026-1 sheets as LifeReady**, so `calcRiders` is ported
  from the validated lifeready engine. iSmart-specific: MEX key is `gender-plan` (e.g. `M-3200`).
  CI 123 is one line whose total equals the workbook's main-CI123 + 3 endorsements (identical sum).

## Data pipeline

`source/*.xlsx` → `scripts/extract.py` (→ `data/premium.json`) + `scripts/extract_cv.py`
(→ `data/cashvalue.json`) → `scripts/build-data.py` (→ `js/data.js`). Re-run only when rates change.

## Validation (the acceptance gate)

- `scripts/capture_groundtruth.py` — LibreOffice headless recalc of the workbook for 8 scenarios
  → `groundtruth.json` (needs `soffice` on PATH).
- `node scripts/validate.mjs` — loads the SHIPPING `data.js`+`engine.js` and asserts main premium,
  the benefit table anchors, and all 8 rider/total scenarios **to the satang**. Must be green.

## Known gaps / TODO

- **iHealthy Ultra (MHP)** and **Roke Rai So Shield (MCI)** are not yet recalc-validated via
  LibreOffice (their plan-text inputs weren't scripted). Their rate tables are the shared A2026-1
  tables validated in lifeready; add scenarios to `capture_groundtruth.py` to close this.
- **Package variants** (`I14>=5`) are out of scope; the standard 6-pay plan only.
- Cover art `hub/covers-minimal-v1/ismart80-6.jpg` not yet created (hub falls back to the icon).

Spec/plan: `docs/superpowers/specs/2026-07-21-ismart80-6-calculator-design.md`,
`docs/superpowers/plans/2026-07-21-ismart80-6-calculator.md`.
