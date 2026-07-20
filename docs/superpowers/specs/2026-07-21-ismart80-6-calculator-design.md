# iSmart 80/6 (W80F06) Calculator — Design Spec

**Date:** 2026-07-21
**Status:** Approved (design), pending spec review
**Product:** ไอสมาร์ท 80/6 (ไม่มีเงินปันผล) — whole-life with annual cash-back, pay 6 years, coverage to age 80
**Source workbook:** `ไอสมาร์ท 80-6_A2026-1.xlsx` (version A2026-1, effective 1 ม.ค. 2569 – 31 มี.ค. 2570)

---

## 1. Goal & Scope

Add a new, self-contained insurance illustration tool for **iSmart 80/6** to the AdvisorTool static site. Full feature parity with the source Excel illustration:

- Input form (customer + payor + plan + riders)
- Main-plan premium + all attachable riders premium
- **Benefit illustration table** (per policy year to age 80): premium, annual/cumulative cash-back, death coverage, cash surrender value, two cash-back options (take cash / accumulate at 0.5%)
- **Cash surrender value** column sourced from the workbook's TABCV tables
- PDF export
- Integration with the shared PIN gate, global header, and hub landing card

This product is **NOT** a re-skin of LifeReady. It shares only the internal rate-lookup plumbing of the workbook family; the product itself has annual survival cash-back (เงินจ่ายคืน) and a 200% maturity benefit that LifeReady does not have. All rates and rules are extracted fresh from **this** workbook (single source of truth).

Out of scope: online submission, saving quotes to a database, multi-language (Thai only, matching source).

---

## 2. Architecture

Clone the proven `lifeready/` multi-file pattern (chosen over a monolithic single-file build for maintainability and to match project convention). No page build step; only a data-regeneration step.

```
ismart80-6/
  index.html            page shell; loads shared assets + ordered js/*.js
  css/styles.css         product styles (pre-compiled, versioned ?v=)
  js/data.js             AUTO-GENERATED rate blob → window.DATA + window.CV (do not hand-edit)
  js/engine.js           calculation engine → window.IS80 (hand-written, 1:1 port of Excel)
  js/config.js           RIDERS definitions, plan constants, STATE, $/fmt helpers
  js/app.js              form build, input read, validation, render, PDF (presentation only)
  data/premium.json      extracted main-plan rate + high-SA discount + maturity
  data/cashvalue.json    extracted TABCV(Male)/(Female) surrender factors
  data/riders.json       extracted rider rate tables (PB, WP, Rider, MEX, iHU, CI123)
  scripts/extract.py     xlsx → data/*.json
  scripts/build-data.py  data/*.json → js/data.js
  scripts/validate.py    ground-truth harness (compares engine output to Excel-computed values)
  source/ไอสมาร์ท 80-6_A2026-1.xlsx
```

**Hard convention (from lifeready/):** ALL arithmetic lives in `engine.js`. `app.js` is presentation only. Script load order is mandatory (shared global scope): `data.js` → `engine.js` → `config.js` → `app.js`.

`js/data.js` is embedded (not fetched) so the tool runs offline / from `file://`.

---

## 3. Data pipeline

Extract from **this** workbook only. Ground-truth values (Excel's own computed cells, read with `data_only=True`) are captured for the validation harness.

| Source sheet | What | → JSON |
|---|---|---|
| `Premium&Maturity` `A2:C86` | Main W80F06 rate per 1,000 SA, keyed `06M`/`06F`, indexed by issue age (row = age + 5) | `premium.json.rate` |
| `Cal` `A28:E34` | High-SA discount tiers (SA thresholds 300k/500k/700k/1M/3M/5M → discount for pay-term `06`) | `premium.json.highSaDiscount` |
| `TABCV(Male)` / `TABCV(Female)` | Surrender factor per 1,000 SA, keyed `06<M/F><age>`, columns = policy year 1..n | `cashvalue.json` |
| `Rate PB` | PB Beyond (payor-waiver) rates, split child (`C5:AB227`) / adult (`C231:CH437`) | `riders.json.pb` |
| `Rate WP` | WP Fit rates, male (`A5:CF119`) / female (`CH4:FM119`) | `riders.json.wp` |
| `Rate Rider` | AP, ECARE, MEB, DCI, PLS, CPR, HIC rate blocks | `riders.json.rider` |
| `Rate rider_MEX` | MEX rates by age × plan | `riders.json.mex` |
| `iHealthy Ultra Rate` | iHealthy Ultra + Roke Rai So Shield rates | `riders.json.ihu` |
| `Rate CI 123` | CI 123 rates | `riders.json.ci123` |

Regeneration is manual and only needed when rates change: `extract.py` → `data/*.json` → `build-data.py` → `js/data.js`.

---

## 4. Calculation engine (engine.js → window.IS80)

Port the Excel `Cal` and `ตารางแสดงผลประโยชน์` formulas exactly, including Excel rounding semantics: `rd()` = ROUNDDOWN/TRUNC, `rnd()` = ROUND. These must not be "simplified" — small rounding differences fail validation.

### 4.1 Mode factors (`Cal!I2:K5`)
| Mode | annual factor | installments/yr |
|---|---|---|
| รายปี | 1.00 | 1 |
| ราย 6 เดือน | 0.52 | 2 |
| ราย 3 เดือน | 0.27 | 4 |
| รายเดือน | 0.09 | 12 |

### 4.2 Main premium (`Cal!G13/H13`, `กรอกข้อมูล!I19`)
- `rateKey = '06' + genderLetter` (M/F)
- `rate = HLOOKUP(rateKey, Premium&Maturity, age+5)` — rate per 1,000 by issue age
- `annualPremium (mode) = ROUNDDOWN((rate − discount + adj) × ROUNDDOWN(SA/1000, 3), 2)`
- `modePremium = ROUNDDOWN(annualPremium × modeFactor, 2)`
- `annualTotal = modePremium × installments`
- **RESOLVED (ground truth):** the workbook computes a high-SA discount tier (`Cal!B34`, e.g. 3 for SA ≥ 1M) but **does not apply it to the main plan** — `Cal!F13` = 0 and `adj` = 0. Verified: age 44/F/SA 1,000,000 → rate 287 × (1,000,000/1000) = **287,000** exactly, no discount. So `discount = 0` and `adj = 0` for the W80F06 main premium.

### 4.3 Benefit illustration, per policy year (`ตารางแสดงผลประโยชน์` rows 14+)
Let `C` = policy year (1-based), `B` = attained age, `SA` = sum assured.

- **Cash-back rate** `couponRate = C ≤ 5 ? 0.01 : (C > 5 && B < 79 ? 0.02 : (B == 79 ? 2.00 : —))`
- **Premium paid this year** = full annual premium while `C ≤ 6`, else 0
- **Cumulative premium** `E` = running sum of premium paid
- **Cash-back this year** `F` = at maturity (`couponRate == 2`): `ROUND(MAX(1.01 × E, 2 × SA, deathBenefit), 0)`; otherwise `ROUND(SA × couponRate, 0)`
- **Accumulate-option value** `G` = `F + 1.005 × Gprev` (0.5% min interest)
- **Death benefit** `H` = `MAX(2 × SA, 1.01 × E, surrenderValue)`
- **Death benefit incl. cash-backs paid** `I` = `H + Σ(F paid so far)`
- **Cash surrender value** `J` = `ROUND(surrenderFactor × SA / 1000, 0)`; `surrenderFactor` = `VLOOKUP(cvKey, TABCV(sex), policyYear)`
- Table runs until attained age 80 (rows stop when `age + C > 79`).

### 4.4 Riders
13 attachable riders, ported with their eligibility rules from `กรอกข้อมูล` rows 19–36 and rate lookups from `Cal` rows 14–38:

PB Beyond, WP Fit, AP, ECARE, MEX, MEB, DCI, PLS10, CPR, HIC, iHealthy Ultra, Roke Rai So Shield, CI 123 (incl. its three mandatory CI-123 endorsements). Each rider carries: min/max issue age, SA min/max (often a function of main SA), control type (SA-driven vs plan-select), package-availability rules, and mutual-exclusion rules (e.g. WP vs PB, DCI vs CPR, HIC requires CPR, CI-123 endorsements require CI-123). These live as a `RIDERS` array in `config.js`; the rate math lives in `engine.js`.

Rider eligibility/limit rules are numerous and encoded verbatim from the Excel `IF(...)` guards; the implementation plan will enumerate each rider's rule set individually.

---

## 5. UI & outputs (app.js)

Two-page flow matching the other tools:

1. **Input page:** customer name/age/gender/payment mode, sum assured, payor (for PB/WP), rider selection with live eligibility validation and inline error messages (ported from the Excel guard strings).
2. **Result page:**
   - Premium summary: main premium + each selected rider + total per year / per mode
   - Benefit illustration table (§4.3) to age 80, with both cash-back options
   - Print / PDF export
   - Print layout follows project print conventions (sections per page, table splitting).

---

## 6. Integration

- Folder/URL: `ismart80-6/`, served as `ismart80-6/index.html`.
- `<head>` includes (paths `../assets/...`): pin-gate config → supabase → pin-gate → click-sound; global-header css + theme + styles.
- `<body>` starts with global-header.js.
- Register on the **root `index.html`** `products` array (one new card object): `href:"ismart80-6/"`, band `iSmart 80/6`, kicker/tagline/bullets, `isNew:true`, cover image under `hub/covers-minimal-v1/`, icon from `ICONS`.
- Add link to the shared "เครื่องมือ" menu in `assets/global-header.js` if products are enumerated there.
- No change needed to gate wiring beyond including the three pin-gate scripts (gate self-mounts).

---

## 7. Correctness / validation

`scripts/validate.py` reads the workbook's own computed cells (`data_only=True`) for a spread of scenarios (multiple ages, both genders, several sum-assured tiers, all payment modes, and a representative set of rider combinations) and asserts the JS engine output matches to the last satang. This is the acceptance gate: **no numbers ship until validation passes.**

The harness drives the **actual shipping `engine.js`** via Node (loading `data.js` + `engine.js`, calling `IS80.calc`) and compares each scenario's output against the workbook's Excel-computed cells. Validating the real engine (not a Python re-implementation) means the thing we test is the thing we ship. Rounding mode (`rd`/`rnd`) mismatches are the most likely failure and must be chased to zero diff.

---

## 8. Risks / open items

1. **High-SA discount application on main plan** — resolve against Excel (see §4.2).
2. **Rider rule completeness** — 13 riders with dense guard logic; each must be transcribed and validated, not paraphrased.
3. **TABCV key format** — confirm exact key (`06<sex><age>`) and column offset (`policyYear + 4`) during extraction.
4. **Package variants** (`I14 >= 5`, the "package" plans) change several rider availabilities and SA constraints — confirm whether these package variants are in scope or only the standard `ชำระเบี้ย 6 ปี` plan. Default assumption: standard 6-pay plan is primary; package variants included only if present and straightforward.
