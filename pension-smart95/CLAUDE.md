# CLAUDE.md — บำนาญ สมาร์ท 95 calculator

Context for working on this project in Claude Code.

## What this is

A **vanilla static web app** (plain HTML + CSS + JS, **no framework — deliberate choice**)
that calculates premiums and benefits for the Thai pension product
*บำนาญ สมาร์ท 95 (A2026-1)*. Every rate table and formula is ported 1:1 from the
official Excel illustration (`reference/*.xlsm`) and verified value-by-value.
Ships two ways: one inlined HTML file (`dist/*.html`) and a static site folder
(`dist/web/`) you can host anywhere. **Do not introduce React/Svelte/etc. or a
bundler** unless the user explicitly asks — keep it dependency-free vanilla.

## Architecture (keep these layers separate)

```
data/db.js ──► src/engine.js ──► src/app.js ──► index.html ──┬─(build.mjs)──► dist/*.html  (1 file)
(rate tables)  (pure calc,       (UI + DOM       (entry at      └─(build_web.mjs)► dist/web/ (static site)
                UI-agnostic)      rendering)       project root)
```

- **`src/engine.js`** — `PensionEngine` class. Pure calculation, **no DOM**. UMD:
  exports to `module.exports` (Node) or `window` (browser). The heart; mirrors the
  Excel `Cal` sheet formulas exactly.
- **`src/app.js`** — all UI: builds the form, handles the two-view flow
  (input → "คำนวณ" → results), renders tables. Uses only `window.DB` and `window.PensionEngine`.
- **`index.html`** (project root) — entry. In dev it loads the assets directly via
  `<script src>` / `<link>` (no bundler, no server needed beyond a static file server).
- **`data/db.js`** = `window.DB = {…}` (browser-loadable); **`data/db.json`** = same data
  for Node tooling (verify/extract).
- **`scripts/build.mjs`** inlines everything into one HTML; **`scripts/build_web.mjs`**
  emits a clean `dist/web/` (index.html + assets/) for hosting.

**Rule:** engine stays UI-free; app stays calc-free. After any change to engine or
data, `npm run verify` must pass (build scripts run it first). **verify + build need
no `npm install`** — pure Node built-ins.

## Calculation flow (engine)

`compute(input)` →
1. `resolveMain(input)` — pick plan, look up main rate, resolve SA ↔ premium ↔ monthly-pension, compute main premium.
2. riders — one method each (`riderAP`, `riderWP`, …); `compute` applies `riderEligibility` (age ranges + cross-rules) and zeroes ineligible ones.
3. `annuitySchedule`, `illustration` (per-year CV / death benefit / pension), `irr`.
4. `tax(...)` is independent (the lower "max annuity for tax" widget).

### Core formulas (match Excel rounding exactly)
Excel helpers reimplemented in engine: `rdown(x,d)` (ROUNDDOWN), `rup` (ROUNDUP),
`rnd` (ROUND), `trunc` (TRUNC). **Do not replace with `Math.round` — the workbook
mixes ROUNDDOWN/TRUNC and the cents must match.**

- Main annual premium = `rdown(rate * rdown(SA/1000, 3), 2)`; mode premium = `rdown(annual * modeFactor, 2)`.
  - rate = `main_rates[planCode+gender][age]` (Premium&Maturity table).
  - modeFactor: รายปี 1 · 6เดือน 0.52 · 3เดือน 0.27 · เดือน 0.09.
- SA from premium input = `rup(premium / rate * 1000 / modeFactor, 0)`.
- SA from monthly pension = `rup(pension / 0.0127, 0)` (first-band monthly factor).
- Annuity benefit %/yr by attained age: ≤75→15%, 76–80→20%, 81–85→25%, 86–95→30% (paid to age 95).
- Death benefit before annuity = `max((policyYear≤2 ? 1.0 : 1.1) * cumPremium, cashValue)`.
- Death benefit during annuity (15-yr guarantee) = `max(PV_remaining_guaranteed, cumPrem−cumPension)`, then `max(0, cumPrem−cumPension)` after.
- Cash value = `cv[planCode+gender+issueAge][policyYear] * SA/1000`.
- PB/WP premium = `trunc(rate * trunc(mainAnnualPremium(capped 30M)/100, 3), 2)` — rate is *per 100 baht of basic premium*.

### Rider eligibility / cross-rules (in `riderEligibility`)
- DCI ↔ CPR mutually exclusive; HIC requires CPR; PB ↔ WP mutually exclusive.
- occ class 4 → ×1.5 for MEB, MEX, iHealthy (MHP), MCI. AP/E-CARE rate is per-occ-class.
- Age ranges per rider are in `riderEligibility`; plan options per age in `mexPlans` / `mebPlans` / `mhpPlans` / `mhpAreas`.

## Data provenance (each table ← exact Excel range; see `scripts/extract_tables.py`)

| `data/tables/*.json` | Source sheet!range | Used by (Cal formula) |
|---|---|---|
| main_rates | Premium&Maturity!B2:Q102 | main rate `D13` (HLOOKUP plancode+gender, age) |
| plans / annuity_benefit | Data Fill Parameter!B5:N12 / B51:F54 | plan select, annuity % |
| rate_dci_pls | Rate Rider!X2:Z257 | DCI `D20`, PLS `D21` |
| rate_meb / rate_ap_ecare | Rate Rider!A4:G73 / AB3:AD6 | MEB `D19`, AP `D16`, ECARE `D17` |
| rate_cancer | Cancer!A4:D90 / E4:H90 | CPR `D47`, HIC `D48` |
| rate_mex | Rate rider_MEX!A5:K95 | MEX `D22` |
| rate_wp / rate_pb | Rate WP / Rate PB | WP `D15`, PB `D14` (index = payment-period years) |
| rate_ihealthy / rate_mci | iHealthy Ultra Rate / CI MED EX RATE (HLOOKUP key, age row) | MHP `G23`, MCI `G24` |
| cv / pv_annual | TAB CV!E3:DB608 / PV Annual!C4:F123 | surrender value, guaranteed-annuity death benefit |

## Verification

`npm run verify` (= `scripts/verify.mjs`) checks the engine against an **oracle**:
the source workbook recomputed in LibreOffice for many input combinations
(`test/oracle/*.json`). Covers 51 main-premium cases, 10 riders, the full 275-cell
annual illustration, tax, and a 1,212-combo robustness sweep. Keep it green.

To regenerate the oracle you'd recompute the xlsm in LibreOffice headless with
forced recalc (`OOXMLRecalcMode=0`) per input case — see git history / ask if needed.

## Gotchas

- **PB/WP in the source workbook are broken**: its "period of pay" lookup (`กรอกข้อมูล!J13`)
  returns `#N/A`, so the original Excel yields 0 for PB/WP. This app computes them
  correctly using `payYears` (= annuityAge − issueAge, or 6 for the 6-pay plans) as
  the rate-table column. So PB/WP can't be oracle-checked against the source; they're
  verified by table+formula trace instead.
- The source has stale external refs (`[45]`, `[46]`) in unused `Cal` helper cells — ignore them.
- Plan availability depends on age (issueAgeMax per plan). `availablePlans(age, payOption)` is the source of truth for which annuity ages are valid.

## Common tasks

- **Update to a new rate version**: drop the new `*.xlsm` into `reference/`, run
  `npm run extract` (rebuilds `data/db.json` + `db.js`), then `npm run verify` and `npm run build`.
- **Add / change a rider**: add the rate table in `extract_tables.py` → add a
  `riderXxx` method in `engine.js` (mirror the Cal formula + rounding) → wire it in
  `compute()` and `riderEligibility()` → add the UI entry in `RIDERS` in `app.js` →
  add an oracle check in `verify.mjs`.
- **Edit the UI**: work in `src/app.js` / `src/styles.css` / `index.html`, run
  `npm run dev` and open `http://localhost:8080/` to iterate, then rebuild.
- **Build**: `npm run build` (one file → `dist/*.html`), `npm run build:web`
  (static site → `dist/web/`), or `npm run build:all`. Each runs verify first.
- **Deploy**: host the `dist/web/` folder (Netlify/Cloudflare Pages/GitHub Pages — static, no backend).
- **Always rebuild** before sharing — `dist/` is the deliverable; editing it directly is overwritten next build.

## Conventions

- Thai-language UI. Brand: teal `#0f4c5c` + gold `#e09f3e`. Fonts: Prompt (headings) / Sarabun (body).
- Vanilla JS, no framework, no runtime/build dependencies. Don't add a bundler or framework unless asked.
- Round every number shown to the user via the engine's helpers / `toLocaleString`.
