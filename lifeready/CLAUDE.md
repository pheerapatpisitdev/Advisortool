# CLAUDE.md — LifeReady Premium Calculator (Vanilla)

Context for Claude Code when working on this project.

## What this is

A **dependency-free** (HTML + CSS + vanilla JS) web app that calculates premiums for the
**ไลฟ์เรดดี้ (LifeReady, Non-Participating)** whole-life product, version **A2026-1**, plus
13 riders, a benefit summary, and the policy cash-value (non-forfeiture) table.

No build step, no npm, no framework. Open `index.html` in a browser and it runs.
Every rate table is extracted from `source/ไลฟ์เรดดี้_A2026-1.xlsx` and the engine is a 1:1
port of that workbook's formulas, validated cell-for-cell against LibreOffice recalculation.

> ⚠️ **This computes real insurance premiums.** Do not change rounding, rate lookups, or
> formulas in `js/engine.js` without re-checking against the source workbook (see "Verifying").

## Run

- Just open `index.html` (works from `file://` — data is embedded as JS, not fetched).
- Or serve: `python3 -m http.server 8000`.

## File layout & load order

`index.html` loads four classic scripts **in this order** (they share global scope):

1. `js/data.js` — `window.DATA` (rate tables) + `window.CV` (cash-value factors). **Generated** by `scripts/build-data.py` from `data/*.json`. Do not hand-edit.
2. `js/engine.js` — `window.LR` = `{ calc, cashValues, calcMain, planInfo, genderLetter }`. The validated calculation engine.
3. `js/config.js` — `RIDERS` array (eligibility, SA min/max, control type), plan-option helpers (`MEB_PLANS`/`MEX_PLANS`/`MHP_PLANS`/`MCI_PLANS`), `STATE`, and `$`/`fmt`/`fmt0` helpers.
4. `js/app.js` — UI: builds the form, reads inputs, calls `LR.calc`, renders the two pages (input → result), validation notes, print.

```
index.html  css/styles.css  js/{data,engine,config,app}.js
data/{premium,cashvalue}.json   ← canonical source for js/data.js
scripts/extract.py        xlsx → data/premium.json
scripts/extract_cv.py     xlsx → data/cashvalue.json
scripts/build-data.py     data/*.json → js/data.js   (run after extract)
scripts/validate.py       LibreOffice ground-truth harness
source/ไลฟ์เรดดี้_A2026-1.xlsx   single source of truth for all rates
```

## Data flow

`source xlsx` → `scripts/extract*.py` → `data/*.json` → `scripts/build-data.py` → `js/data.js`
→ loaded as `window.DATA`/`window.CV` → `app.js` builds input + validation → `LR.calc(DATA, CV, inp)`
→ rendered into the result page. UI never does arithmetic; all premium math is in `js/engine.js`.

## Engine (`js/engine.js`) — formula reference

- **Rounding.** `rd(x,n)` = Excel `ROUNDDOWN`/`TRUNC` toward zero (used everywhere except HIC). `rnd(x,n)` = Excel `ROUND` (HIC + cash-value display). Don't "simplify" them.
- **Mode factors** (`DATA.modes`): รายปี ×1, ราย6เดือน ×0.52, ราย3เดือน ×0.27, รายเดือน ×0.09. Per-mode premium = `rd(annual × factor, 2)`.
- **Main plan.** `seq` 1–6 → plancode + payment years (`planInfo`): 1=W99FU06/6y, 2=W99FU12/12y, 3=W99FU18 (SA≥300k→W99FH18)/18y, 4=W99FU99 (SA≥300k→W99FH99)/(99−age)y, 5=W99F99H, 6=W99F99M. Rate key = `plancodeTerm[plancode]+gender` → `mainRate[key][age]`. Subtract high-SA discount (SA<300k → 0). `annual = rd((rate−disc)×rd(SA/1000,3),2)`. Issue-age guard from `pptPlans` (standard 0–70, Health Ultra 6–80) → `main.ok=false` if out of range.
- **PB / WP.** premium = `rate × base/100` where `base` = main premium (SA capped 30M). PB key `PB{PD|SD}{D|DCI}+payerGender+payerAge`; parent table if insured ≤15 (waiver col `min(payYear,25−age)`), spouse if ≥16 (col `payYear`). WP key `WPTPD+gender+age`, col `payYear`.
- **AP/ECARE.** `rate(occClass)×SA/1000`. **MEB/MEX.** table value IS the annual premium; ×1.5 if occClass 4. **iHealthy(MHP)/Roke(MCI).** key built from plan/area/coverage/ageType/gender; ×1.5 if occClass 4. **DCI/CPR.** `rate(gender,age)×SA/1000`. **PLS10.** `(rate−disc)×SA/1000`, disc 0.5 @≥500k, 1 @≥1M. **HIC.** `rnd(rate×SA/1000,2)`, needs CPR. **CI 123.** 6 components (SA fractions 100/25/25/min(20%,100k)/25/10 %; Juvenile=0 if age>18).
- **Cash value** (`cashValues`): key `termkey+gender+issueAge` in `CV`; blocks `p` surrender, `e` extended-term (`years*1000+days`), `n` paid-up; display = factor × SA / 1000.

## Source sheet → table map (`scripts/extract.py`)

| Table | Sheet |
|---|---|
| main rate | `Premium&Maturity` (age rows, termkey+gender cols) |
| plancode→term / high-SA disc / modes | `Cal` (N27:O34, A28:E33, I2:K5) |
| plan list + issue ages | `กรอกข้อมูล` (A76:J81) |
| AP/ECARE, MEB, DCI/PLS/CPR/HIC | `Rate Rider` |
| MEX | `Rate rider_MEX` |
| iHealthy / MCI | `iHealthy Ultra Rate` / `CI MED EX RATE` |
| CI 123 | `Rate CI 123` |
| WP / PB | `Rate WP` / `Rate PB` |
| cash value | `TABCV(Male)` / `TABCV(Female)` (cols 106+/207+/308+) |

## Verifying after changes

There is no automated test runner in this vanilla build, but the engine is identical to the
React project's `tests/engine.test.js`. Known-good checks (annual / per-mode):
- main a30F seq4 SA150k รายปี = **2025**; a40M seq4 SA1M = **19500**.
- Full saved combo (a30F seq4 SA150k, occ4, +WP +Roke(S) +CI123 3M) total = **15,305.10**.
- AP 500k=1500, ECARE 500k=3250, MEB 5000=6500, MEX 3200=11573, MCI(S) occ1=1993 / occ4=2989.5, iHealthy Smart TH=17500, PB spouse(payer35M)=1921.32, CPR 300k=84, HIC=113.9.
- Cash value yr2 paid-up (a30F seq4 150k) = 3000.

To regenerate ground truth from the real workbook: `python3 scripts/validate.py` (needs LibreOffice).
You can sanity-check in the browser console: `LR.calc(DATA, CV, {age:30,sex:'หญิง',mode:'รายปี',seq:4,mainSA:150000,occ:1}).main.mode` → 2025.

## Conventions

- All premium math stays in `js/engine.js`; `app.js` is presentation only.
- `js/data.js` is generated — edit `data/*.json` (or the xlsx) and re-run the scripts instead.
- Thai UI strings throughout. Embedding ~1.1 MB of data in `data.js` is intentional (offline, zero-dependency).
