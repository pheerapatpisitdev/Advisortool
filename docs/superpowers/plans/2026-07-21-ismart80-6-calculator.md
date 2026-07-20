# iSmart 80/6 (W80F06) Calculator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained iSmart 80/6 (W80F06) insurance illustration tool — premium, annual cash-back, death coverage, cash surrender value table to age 80, all 13 riders, and PDF — matching the source Excel to the satang.

**Architecture:** Clone the `lifeready/` multi-file pattern under a new `ismart80-6/` folder: an auto-generated `js/data.js` rate blob, a hand-written `js/engine.js` (all arithmetic), `js/config.js` (rider defs + state), and `js/app.js` (presentation only). A Python pipeline extracts rates from the workbook to JSON, builds `data.js`, and a Node-driven harness validates engine output against Excel-computed ground truth.

**Tech Stack:** Static HTML/CSS/JS (no framework, no page build). Python 3 + openpyxl for extraction/validation. Node for the validation harness. Served by `python3 -m http.server` (`npm run dev`, port 8080).

**Spec:** `docs/superpowers/specs/2026-07-21-ismart80-6-calculator-design.md`

---

## Reference constants (from the workbook — use verbatim)

**Mode factors** (`Cal!I2:K5`): รายปี → factor 1.00, installments 1 · ราย 6 เดือน → 0.52, 2 · ราย 3 เดือน → 0.27, 4 · รายเดือน → 0.09, 12.

**Main premium** (`Cal` row 13): `rateKey = '06' + genderLetter`; `rate = Premium&Maturity` HLOOKUP by key, row `issueAge + 5` (range `A2:C86`); `annual = rd((rate − 0 + 0) × rd(SA/1000, 3), 2)`; `mode = rd(annual × modeFactor, 2)`; `annualTotal = mode × installments`. **No high-SA discount on main plan** (`F13`=0).

**Benefit table** (`ตารางแสดงผลประโยชน์` rows 14+), per policy year `C` (1-based), attained age `B`, `SA`:
- `couponRate = C ≤ 5 ? 0.01 : (C > 5 && B < 79 ? 0.02 : (B === 79 ? 2.0 : null))`
- `premiumPaid = C ≤ 6 ? annualTotalMain : 0`
- `cumPrem = Σ premiumPaid`
- `cashback = couponRate === 2.0 ? round(max(1.01×cumPrem, 2×SA, deathBenefit), 0) : round(SA × couponRate, 0)`
- `accumValue = cashback + 1.005 × accumValuePrev`  (year 1: `accumValue = cashback`)
- `surrenderFactor = TABCV(sex)` VLOOKUP key `'06'+sex+age0` (issue age), column = policy year `C`
- `surrender = round(surrenderFactor × SA / 1000, 0)`
- `deathBenefit = max(2×SA, 1.01×cumPrem, surrender)`
- `deathBenefitInclCoupons = deathBenefit + Σ(cashback of prior years)` (see ground truth: `I` = `H` + sum of earlier `F`)
- table stops when `issueAge + C > 79` (last row is attained age 79 → the maturity row where couponRate = 2.0)

**Rounding:** `rd(x, n)` = ROUNDDOWN/TRUNC toward zero at `n` decimals; `rnd(x, n)` = ROUND half-up. Port both from `lifeready/js/engine.js` — do not simplify.

**Ground-truth anchor scenario** — age 44, female, SA 1,000,000, annual (verified from workbook, `data_only`):
- main: rate 287, annual 287,000, mode 287,000.
- benefit rows (year: cashback / accum / death / deathInclCoupons / surrender):
  - y1: 10,000 / 10,000 / 2,000,000 / 2,000,000 / 45,000
  - y2: 10,000 / 20,050 / 2,000,000 / 2,010,000 / 182,000
  - y3: 10,000 / 30,150.25 / 2,000,000 / 2,020,000 / 467,000
  - y5: 10,000 / 50,502.50625625 / 2,000,000 / 2,040,000 / 1,043,000
  - y6: 20,000 / 70,755.0187875… / 2,000,000 / 2,050,000 / 1,273,000
  - y7: 20,000 (premium now 0) / … / 2,000,000 / 2,070,000 / 1,290,000

**Rider rate lookups** (`Cal` rows 14–38, use these ranges in extraction):
| Rider | Excel row | Rate source range | Lookup |
|---|---|---|---|
| PB Beyond | 14 | `Rate PB` child `C5:AB227`, adult `C231:CH437` | key `plancode+payorSex+payorAge`, col `payWaivePeriod+1` |
| WP Fit | 15 | `Rate WP` male `A5:CF119`, female `CH4:FM119` | key `plancode+sex+age`, col `PPP+1` |
| AP | 16 | `Rate Rider!AB3:AD6` | VLOOKUP occ-class, per 1,000 |
| ECARE | 17 | `Rate Rider!AB3:AD6` | VLOOKUP occ-class, per 1,000 |
| MEB | 19 | `Rate Rider!A4:G73` | INDEX age × plan |
| DCI | 20 | `Rate Rider!X2:Z257` | INDEX `key-age` × sex, per 1,000 |
| PLS10 | 21 | `Rate Rider!X2:Z257` | INDEX `key-age` × sex, per 1,000, high-SA discount F21 |
| MEX | 22 | `Rate rider_MEX!A5:K95` | INDEX age × `sex-plan` |
| iHealthy Ultra | 23 | `iHealthy Ultra Rate!D8` | plan-select |
| CI 123 (MCI) | 24 | `CI MED EX RATE!D8` | plan-select |
| CPR | 37 | `Rate Rider!Y258:Z342` | INDEX `key-age` × sex, per 1,000 |
| HIC | 38 | `Rate Rider!Y343:Z427` | INDEX `key-age` × sex, per 1,000 |
| Roke Rai So Shield | — | (plan-select, from `ผลประโยชน์`/rate sheet) | plan-select |

Each rider's mode premium = `rd(annualRiderPremium × modeFactor, 2)`. Occ-class multiplier: monthly (installments 4 case in Excel `E=4`) applies ×1.5 for some riders — port the exact `IF(E=4,1.5,1)` guards.

---

## File Structure

- `ismart80-6/index.html` — page shell, shared includes, ordered script tags
- `ismart80-6/css/styles.css` — product styles
- `ismart80-6/js/data.js` — GENERATED: `window.DATA`, `window.CV`
- `ismart80-6/js/engine.js` — `window.IS80 = { calc, calcMain, benefitTable, calcRiders, rd, rnd }`
- `ismart80-6/js/config.js` — `RIDERS[]`, `PLAN`, `STATE`, `$`/`fmt`/`fmt0`
- `ismart80-6/js/app.js` — form build, read, validate, render, PDF
- `ismart80-6/data/{premium,cashvalue,riders}.json` — extracted rates
- `ismart80-6/scripts/{extract,build-data,validate}.py` and `scripts/validate.mjs`
- `ismart80-6/source/ไอสมาร์ท 80-6_A2026-1.xlsx` — source workbook
- `ismart80-6/groundtruth.json` — Excel-computed scenarios for the harness
- Modify: root `index.html` (products array) and `assets/global-header.js` (menu), + cover image in `hub/covers-minimal-v1/`

---

## Task 1: Scaffold folder + copy source workbook

**Files:**
- Create: `ismart80-6/` tree, copy the xlsx into `ismart80-6/source/`

- [ ] **Step 1: Create directories and copy the workbook**

```bash
mkdir -p ismart80-6/{css,js,data,scripts,source}
cp "/Users/pheerapatpisit/Desktop/iSmart 80:6/ไอสมาร์ท 80-6_A2026-1.xlsx" ismart80-6/source/
ls -la ismart80-6/source/
```

Expected: the `.xlsx` listed in `ismart80-6/source/`.

- [ ] **Step 2: Commit**

```bash
git add ismart80-6/source/
git commit -m "chore(ismart80-6): add source workbook A2026-1"
```

---

## Task 2: Extract main premium table → premium.json

**Files:**
- Create: `ismart80-6/scripts/extract_premium.py`, `ismart80-6/data/premium.json`

- [ ] **Step 1: Write the extraction script**

```python
# ismart80-6/scripts/extract_premium.py
import json, openpyxl, pathlib
SRC = pathlib.Path(__file__).parent.parent / "source" / "ไอสมาร์ท 80-6_A2026-1.xlsx"
OUT = pathlib.Path(__file__).parent.parent / "data" / "premium.json"

wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
ws = wb["Premium&Maturity"]
# Row 2 = key ('06M','06F') in cols B,C ; rate for issue age A = row A+5
rows = list(ws.iter_rows(min_row=1, max_row=86, max_col=3, values_only=True))
key_m, key_f = rows[1][1], rows[1][2]      # '06M', '06F'
rate = {"M": {}, "F": {}}
for age in range(0, 81):
    r = age + 5                             # Cal: HLOOKUP(..., B2+5)
    if r - 1 < len(rows):
        vm, vf = rows[r-1][1], rows[r-1][2]
        if isinstance(vm, (int, float)): rate["M"][str(age)] = vm
        if isinstance(vf, (int, float)): rate["F"][str(age)] = vf
data = {"keyM": key_m, "keyF": key_f, "rate": rate,
        "highSaDiscountUnusedOnMain": True}
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1))
print("ages M:", sorted(int(a) for a in rate["M"]))
print("rate F age44:", rate["F"].get("44"))
```

- [ ] **Step 2: Run it and verify the anchor value**

Run: `python3 ismart80-6/scripts/extract_premium.py`
Expected: `rate F age44: 287` printed, and ages cover at least 25–65.

- [ ] **Step 3: Commit**

```bash
git add ismart80-6/scripts/extract_premium.py ismart80-6/data/premium.json
git commit -m "feat(ismart80-6): extract W80F06 main premium rates"
```

---

## Task 3: Extract cash surrender factors → cashvalue.json

**Files:**
- Create: `ismart80-6/scripts/extract_cv.py`, `ismart80-6/data/cashvalue.json`

- [ ] **Step 1: Write the extraction script**

```python
# ismart80-6/scripts/extract_cv.py
import json, openpyxl, pathlib
SRC = pathlib.Path(__file__).parent.parent / "source" / "ไอสมาร์ท 80-6_A2026-1.xlsx"
OUT = pathlib.Path(__file__).parent.parent / "data" / "cashvalue.json"
wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)

def grab(sheet, sex):
    ws = wb[sheet]
    out = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        key = row[0]                        # e.g. '06M25'
        if not key or not str(key).startswith("06"): continue
        age = row[3]                        # CVAGE col D
        # factors start at col E (index 4) = policy year 1
        factors = [v for v in row[4:] if isinstance(v, (int, float))]
        out[str(age)] = factors
    return out

data = {"M": grab("TABCV(Male)", "M"), "F": grab("TABCV(Female)", "F")}
OUT.write_text(json.dumps(data, ensure_ascii=False))
print("F age44 year1:", data["F"]["44"][0], "year7:", data["F"]["44"][6])
```

- [ ] **Step 2: Run it and verify anchors**

Run: `python3 ismart80-6/scripts/extract_cv.py`
Expected: `F age44 year1: 45 year7: 1290` (matches surrender 45,000 and 1,290,000 at SA 1M).

- [ ] **Step 3: Commit**

```bash
git add ismart80-6/scripts/extract_cv.py ismart80-6/data/cashvalue.json
git commit -m "feat(ismart80-6): extract TABCV surrender factors"
```

---

## Task 4: Extract rider rate tables → riders.json

**Files:**
- Create: `ismart80-6/scripts/extract_riders.py`, `ismart80-6/data/riders.json`

- [ ] **Step 1: Write the extraction script**

Extract each rider block using the ranges in the Reference table above. Store each as a plain lookup structure keyed the way `engine.js` will read it. Capture raw cells so the engine (not the script) does the lookup logic.

```python
# ismart80-6/scripts/extract_riders.py
import json, openpyxl, pathlib
SRC = pathlib.Path(__file__).parent.parent / "source" / "ไอสมาร์ท 80-6_A2026-1.xlsx"
OUT = pathlib.Path(__file__).parent.parent / "data" / "riders.json"
wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)

def block(sheet, rng):
    ws = wb[sheet]
    return [[c for c in row] for row in ws[rng]]

data = {
  "pb":   {"child": block("Rate PB", "C5:AB227"),
           "adult": block("Rate PB", "C231:CH437")},
  "wp":   {"male": block("Rate WP", "A5:CF119"),
           "female": block("Rate WP", "CH4:FM119")},
  "rider": block("Rate Rider", "A1:AL427"),        # AP/ECARE/MEB/DCI/PLS/CPR/HIC (engine slices by row range)
  "mex":  block("Rate rider_MEX", "A5:K95"),
  "ihu":  block("iHealthy Ultra Rate", "A1:BU111"),
  "ci123":block("Rate CI 123", "A1:GX15"),
}
OUT.write_text(json.dumps(data, ensure_ascii=False))
print({k: (len(v) if isinstance(v, list) else {kk: len(vv) for kk,vv in v.items()}) for k,v in data.items()})
```

- [ ] **Step 2: Run it and eyeball shapes**

Run: `python3 ismart80-6/scripts/extract_riders.py`
Expected: non-empty block sizes printed for every rider (no zero-length arrays).

- [ ] **Step 3: Commit**

```bash
git add ismart80-6/scripts/extract_riders.py ismart80-6/data/riders.json
git commit -m "feat(ismart80-6): extract rider rate tables"
```

---

## Task 5: Build data.js from JSON

**Files:**
- Create: `ismart80-6/scripts/build-data.py`, `ismart80-6/js/data.js` (generated)

- [ ] **Step 1: Write the builder**

```python
# ismart80-6/scripts/build-data.py
import json, pathlib
base = pathlib.Path(__file__).parent.parent
prem = json.loads((base/"data/premium.json").read_text())
cv   = json.loads((base/"data/cashvalue.json").read_text())
rid  = json.loads((base/"data/riders.json").read_text())
blob = {"premium": prem, "cv": cv, "riders": rid}
js = ("// AUTO-GENERATED by scripts/build-data.py — do not edit by hand.\n"
      "window.DATA = " + json.dumps(blob["premium"], ensure_ascii=False) + ";\n"
      "window.CV = " + json.dumps(blob["cv"], ensure_ascii=False) + ";\n"
      "window.RIDERDATA = " + json.dumps(blob["riders"], ensure_ascii=False) + ";\n")
(base/"js/data.js").write_text(js, encoding="utf-8")
print("data.js bytes:", len(js))
```

- [ ] **Step 2: Run it**

Run: `python3 ismart80-6/scripts/build-data.py && node -e "global.window={};require('./ismart80-6/js/data.js');console.log(window.DATA.rate.F['44'])"`
Expected: `287`.

- [ ] **Step 3: Commit**

```bash
git add ismart80-6/scripts/build-data.py ismart80-6/js/data.js
git commit -m "feat(ismart80-6): build data.js blob"
```

---

## Task 6: engine.js — rounding helpers + main premium

**Files:**
- Create: `ismart80-6/js/engine.js`
- Test: `ismart80-6/scripts/validate.mjs` (Node test harness, grown across tasks)

- [ ] **Step 1: Write the failing test**

```js
// ismart80-6/scripts/validate.mjs
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
global.window = {};
new Function(readFileSync('./ismart80-6/js/data.js','utf8'))();
new Function(readFileSync('./ismart80-6/js/engine.js','utf8'))();
const IS80 = window.IS80;

// main premium: age 44 F, SA 1,000,000, annual
const m = IS80.calcMain(window.DATA, {age:44, sex:'F', sa:1000000, mode:'รายปี'});
assert.strictEqual(m.annual, 287000, `annual ${m.annual}`);
assert.strictEqual(m.mode, 287000, `mode ${m.mode}`);
assert.strictEqual(m.annualTotal, 287000, `annualTotal ${m.annualTotal}`);
console.log('Task 6 main premium: PASS');
```

- [ ] **Step 2: Run to verify it fails**

Run: `node ismart80-6/scripts/validate.mjs`
Expected: FAIL (`window.IS80` undefined / engine.js missing).

- [ ] **Step 3: Write minimal engine.js**

```js
// ismart80-6/js/engine.js
(function(){
  function rd(x, n){ const f = Math.pow(10,n); return Math.trunc(x*f + (x>=0?1e-9:-1e-9))/f; } // ROUNDDOWN/TRUNC
  function rnd(x, n){ const f = Math.pow(10,n); return Math.round(x*f)/f; }                     // ROUND half-up
  const MODES = {
    'รายปี':      {factor:1.00, inst:1},
    'ราย 6 เดือน': {factor:0.52, inst:2},
    'ราย 3 เดือน': {factor:0.27, inst:4},
    'รายเดือน':    {factor:0.09, inst:12},
  };
  function calcMain(DATA, inp){
    const rate = DATA.rate[inp.sex][String(inp.age)];
    const md = MODES[inp.mode];
    const annual = rd((rate - 0 + 0) * rd(inp.sa/1000, 3), 2);   // no high-SA discount on main
    const mode = rd(annual * md.factor, 2);
    return { rate, annual, mode, annualTotal: rd(mode * md.inst, 2), modeMeta: md };
  }
  window.IS80 = { rd, rnd, MODES, calcMain };
})();
```

- [ ] **Step 4: Run to verify it passes**

Run: `node ismart80-6/scripts/validate.mjs`
Expected: `Task 6 main premium: PASS`.

- [ ] **Step 5: Commit**

```bash
git add ismart80-6/js/engine.js ismart80-6/scripts/validate.mjs
git commit -m "feat(ismart80-6): engine main premium + rounding helpers"
```

---

## Task 7: engine.js — benefit illustration table

**Files:**
- Modify: `ismart80-6/js/engine.js` (add `benefitTable`)
- Test: `ismart80-6/scripts/validate.mjs`

- [ ] **Step 1: Add the failing test (append before the final console.log)**

```js
// benefit table: age 44 F, SA 1,000,000, annual
const bt = IS80.benefitTable(window.DATA, window.CV, {age:44, sex:'F', sa:1000000, mode:'รายปี', annualTotalMain:287000});
const y = n => bt.find(r => r.year === n);
assert.strictEqual(y(1).cashback, 10000);
assert.strictEqual(y(1).death, 2000000);
assert.strictEqual(y(1).surrender, 45000);
assert.strictEqual(y(2).accum, 20050);
assert.strictEqual(y(2).deathInclCoupons, 2010000);
assert.strictEqual(y(6).cashback, 20000);
assert.strictEqual(y(7).premium, 0);
assert.strictEqual(y(7).surrender, 1290000);
assert.strictEqual(bt[bt.length-1].age, 79);       // last row is maturity at age 79
console.log('Task 7 benefit table: PASS');
```

- [ ] **Step 2: Run to verify it fails**

Run: `node ismart80-6/scripts/validate.mjs`
Expected: FAIL (`benefitTable is not a function`).

- [ ] **Step 3: Implement benefitTable in engine.js**

```js
// add inside the IIFE, then export it
function benefitTable(DATA, CV, inp){
  const rd = window.IS80 ? window.IS80.rd : null; // available after export; use local refs below
  const round0 = x => Math.round(x);              // ROUND half-up to integer
  const factors = CV[inp.sex][String(inp.age)];   // policy-year-indexed surrender factors per 1000
  const rows = [];
  let cum = 0, accumPrev = 0, couponsPaid = 0;
  for (let year = 1; ; year++){
    const age = inp.age + year - 1;
    if (age > 79) break;
    const couponRate = year <= 5 ? 0.01 : (year > 5 && age < 79 ? 0.02 : (age === 79 ? 2.0 : null));
    const premium = year <= 6 ? inp.annualTotalMain : 0;
    cum += premium;
    const factor = factors[year-1] || 0;
    const surrender = round0(factor * inp.sa / 1000);
    let cashback, death;
    if (couponRate === 2.0){                        // maturity row (age 79)
      death = Math.max(2*inp.sa, 1.01*cum, surrender);
      cashback = round0(Math.max(1.01*cum, 2*inp.sa, death));
    } else {
      death = Math.max(2*inp.sa, 1.01*cum, surrender);
      cashback = round0(inp.sa * couponRate);
    }
    const accum = year === 1 ? cashback : cashback + 1.005 * accumPrev;
    const deathInclCoupons = death + couponsPaid;   // coupons paid in PRIOR years
    rows.push({ year, age, premium, cumPrem: cum, cashback, accum, death, deathInclCoupons, surrender });
    accumPrev = accum;
    couponsPaid += cashback;
  }
  return rows;
}
// update the export line:
// window.IS80 = { rd, rnd, MODES, calcMain, benefitTable };
```

Note on `deathInclCoupons`: ground truth `I` at year 2 = 2,010,000 = death(2,000,000) + cashbacks from years < 2 (only year 1's 10,000). So add `couponsPaid` **before** incrementing it with the current year — matching the code above.

- [ ] **Step 4: Run to verify it passes**

Run: `node ismart80-6/scripts/validate.mjs`
Expected: `Task 7 benefit table: PASS`.

- [ ] **Step 5: Commit**

```bash
git add ismart80-6/js/engine.js ismart80-6/scripts/validate.mjs
git commit -m "feat(ismart80-6): engine benefit illustration table"
```

---

## Task 8: Capture rider ground truth from Excel → groundtruth.json

**Files:**
- Create: `ismart80-6/scripts/capture_groundtruth.py`, `ismart80-6/groundtruth.json`

- [ ] **Step 1: Write a script that records the workbook's computed rider premiums for the default scenario and 3 more scenarios**

The workbook cells are read `data_only`. Record, per scenario, the input (`กรอกข้อมูล!C5,C6,C7,D19` and each rider's selection cell + SA) and the computed mode premium (`กรอกข้อมูล!F20…F36`) and annual (`I…`). Use the default scenario already in the file plus 3 you set via a temporary LibreOffice recalc, OR record only the default scenario if headless recalc is unavailable (document the limitation with `log`-style print).

```python
# ismart80-6/scripts/capture_groundtruth.py
import json, openpyxl, pathlib
SRC = pathlib.Path(__file__).parent.parent / "source" / "ไอสมาร์ท 80-6_A2026-1.xlsx"
OUT = pathlib.Path(__file__).parent.parent / "groundtruth.json"
wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
inp = wb["กรอกข้อมูล"]
def v(c): return inp[c].value
riders = {}
for r in range(19, 37):
    name = inp[f"A{r}"].value
    if name and inp[f"F{r}"].value not in (None, 0, ""):
        riders[str(name)] = {"sa": inp[f"D{r}"].value, "modePremium": inp[f"F{r}"].value}
scen = {"age": v("C5"), "sex": v("C6"), "mode": v("C7"), "mainSA": v("D19"),
        "mainMode": v("F19"), "totalFirst": v("F37"), "riders": riders}
OUT.write_text(json.dumps({"scenarios": [scen]}, ensure_ascii=False, indent=1))
print(json.dumps(scen, ensure_ascii=False, indent=1))
```

- [ ] **Step 2: Run it**

Run: `python3 ismart80-6/scripts/capture_groundtruth.py`
Expected: JSON printed with `mainMode: 287000`, `totalFirst: 332539.5`, and a `riders` map with each default rider's SA + premium.

- [ ] **Step 3: Commit**

```bash
git add ismart80-6/scripts/capture_groundtruth.py ismart80-6/groundtruth.json
git commit -m "test(ismart80-6): capture Excel rider ground truth"
```

---

## Task 9: engine.js — riders (one rider group per sub-step, TDD against ground truth)

**Files:**
- Modify: `ismart80-6/js/engine.js` (add `calcRiders` + per-rider lookups)
- Test: `ismart80-6/scripts/validate.mjs` (assert each default rider premium equals `groundtruth.json`)

Implement riders in this order, each as its own failing-test → implement → pass → commit cycle. For each rider, the lookup mechanics are in the Reference table; the acceptance assertion is: engine premium for the default scenario == the value in `groundtruth.json.riders[name].modePremium`. Riders not present in the default scenario get a dedicated scenario added to `groundtruth.json` (extend Task 8's script) before implementing.

- [ ] **Step 1: DCI** — `INDEX(Rate Rider!X2:Z257, MATCH(name-age), MATCH(sex))`, premium `rd((rate)×SA/1000, 2)`, mode `rd(annual×factor,2)`. Test == ground truth. Commit.
- [ ] **Step 2: CI 123 (MCI)** — plan-select rate `CI MED EX RATE!D8` path + the three mandatory CI-123 endorsement premiums (`กรอกข้อมูล!F34:F36` derived from `AJ28` percentages 20%/25%/10%). Test == ground truth. Commit.
- [ ] **Step 3: MEB** — `INDEX(Rate Rider!A4:G73, MATCH(age), MATCH(plan))`, `×1.5` when monthly. Commit.
- [ ] **Step 4: MEX** — `INDEX(Rate rider_MEX!A5:K95, MATCH(age), MATCH(sex-plan))`. Commit.
- [ ] **Step 5: AP + ECARE** — `VLOOKUP(occ-class, Rate Rider!AB3:AD6)` cols 2/3, `rd(rate×SA/1000,2)`. Commit.
- [ ] **Step 6: PLS10** — `INDEX(Rate Rider!X2:Z257,…)` with high-SA discount `F21` (SA≥1M→1, ≥500k→0.5, else 0), `rd((rate−disc)×SA/1000,2)`. Commit.
- [ ] **Step 7: CPR + HIC** — `INDEX(Rate Rider!Y258:Z342)` / `Y343:Z427`. Commit.
- [ ] **Step 8: PB Beyond** — `Rate PB` child/adult split by insured age ≤15, col = pay-waive period + 1, payor age/sex keyed. Commit.
- [ ] **Step 9: WP Fit** — `Rate WP` male/female, col = PPP + 1. Commit.
- [ ] **Step 10: iHealthy Ultra + Roke Rai So Shield** — plan-select rates. Commit.
- [ ] **Step 11: `calcRiders(DATA, RIDERDATA, inp)`** aggregator returning `[{key,name,sa,annual,mode}]`; assert the **sum of all default riders + main == `totalFirst` (332,539.5)**. Commit.

After each sub-step run `node ismart80-6/scripts/validate.mjs` and require PASS before moving on. Any satang mismatch is a rounding-mode bug (`rd` vs `rnd`) — fix it, do not loosen the assertion.

---

## Task 10: engine.js — top-level calc() aggregator

**Files:**
- Modify: `ismart80-6/js/engine.js`
- Test: `ismart80-6/scripts/validate.mjs`

- [ ] **Step 1: Add failing test**

```js
const full = IS80.calc(window.DATA, window.CV, window.RIDERDATA, {
  age:44, sex:'F', sa:1000000, mode:'รายปี',
  riders:{ /* the default scenario's rider selections from groundtruth.json */ }
});
assert.strictEqual(full.main.annualTotal, 287000);
assert.strictEqual(Math.round(full.firstPremium*100)/100, 332539.5);
assert.ok(full.benefit.length > 0);
console.log('Task 10 calc(): PASS');
```

- [ ] **Step 2: Run — expect FAIL.** Run: `node ismart80-6/scripts/validate.mjs`
- [ ] **Step 3: Implement `calc()`** combining `calcMain`, `calcRiders`, `benefitTable`; `firstPremium = main.mode + Σ rider.mode`; export it.
- [ ] **Step 4: Run — expect `Task 10 calc(): PASS`.**
- [ ] **Step 5: Commit** `feat(ismart80-6): engine top-level calc aggregator`.

---

## Task 11: config.js — riders, plan constants, state, formatters

**Files:**
- Create: `ismart80-6/js/config.js`

- [ ] **Step 1: Define constants** — port `PLAN = {code:'W80F06', name:'ไอสมาร์ท 80/6 (ไม่มีเงินปันผล)', payTerm:6, maxCoverAge:80, issueMin:25, issueMax:65, saMin:150000}`; `MODES` label list; `$`/`fmt`/`fmt0` helpers (thousand separators per project convention — reuse from `lifeready/js/config.js`).

- [ ] **Step 2: Define `RIDERS` array** — one object per rider with `{key, name, ctl:('sa'|'plan'), min, max, smin, smax(fn), rules[]}` transcribed from `กรอกข้อมูล` rows 19–36 guard formulas (issue-age windows in column G, SA min/max in B/C, mutual exclusions: WP↔PB, DCI↔CPR, HIC requires CPR, CI-123 endorsements require CI-123, package `I14>=5` availability). Each rule is a predicate returning an error string or `''`.

- [ ] **Step 3: Manual check** — `node -e` load config.js after data.js/engine.js; assert `RIDERS.length === 13` and no throw.

- [ ] **Step 4: Commit** `feat(ismart80-6): config riders + state + formatters`.

---

## Task 12: index.html shell + shared includes

**Files:**
- Create: `ismart80-6/index.html`
- Reference: top of `lifeready/index.html` (head/body include order)

- [ ] **Step 1: Write the shell** — `<head>`: pin-gate config → supabase.min.js → pin-gate.js → click-sound (paths `../assets/...`), global-header.css, theme.css, css/styles.css; `<body>` opens with global-header.js; two containers `#input-page` and `#result-page`; bottom script tags in mandatory order:

```html
<script src="js/data.js?v=1"></script>
<script src="js/engine.js?v=1"></script>
<script src="js/config.js?v=1"></script>
<script src="js/app.js?v=1"></script>
```

- [ ] **Step 2: Smoke test** — with `npm run dev` running, `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ismart80-6/` → `200`.

- [ ] **Step 3: Commit** `feat(ismart80-6): page shell + shared includes`.

---

## Task 13: css/styles.css

**Files:**
- Create: `ismart80-6/css/styles.css`

- [ ] **Step 1:** Start from `lifeready/css/styles.css` conventions (theme tokens, card, table, print rules). Adapt product accent + benefit-table columns. Include `@media print` per project print conventions (sections per page, `@page{margin:0}`, table split).
- [ ] **Step 2:** Load the page in a browser (or via `/run` skill) and confirm layout renders unstyled-free.
- [ ] **Step 3: Commit** `feat(ismart80-6): styles`.

---

## Task 14: app.js — form, validation, premium render

**Files:**
- Create: `ismart80-6/js/app.js`

- [ ] **Step 1:** Build the input form from `PLAN` + `RIDERS` + `STATE`; wire inputs.
- [ ] **Step 2:** On calculate: read inputs, run each rider's `rules[]` → show inline errors; if valid call `IS80.calc(...)`.
- [ ] **Step 3:** Render premium summary (main + each rider + total per year/mode) with `fmt` thousand separators.
- [ ] **Step 4:** Manual browser test with the anchor scenario (age 44 F, SA 1M, annual) → main premium shows `287,000`.
- [ ] **Step 5: Commit** `feat(ismart80-6): input form + premium render`.

---

## Task 15: app.js — benefit illustration table render

**Files:**
- Modify: `ismart80-6/js/app.js`

- [ ] **Step 1:** Render `full.benefit` rows into the results table: columns อายุ / ปีที่ / เบี้ยสัญญาหลัก / เงินจ่ายคืน (ต่อปี, สะสม G) / ความคุ้มครองเสียชีวิต / ผลประโยชน์เสียชีวิตรวมเงินคืน / มูลค่าเวนคืน. Two cash-back option columns (รับเงินสด `cashback`, สะสม `accum`).
- [ ] **Step 2:** Manual browser test: year-1 row shows cashback 10,000 / death 2,000,000 / surrender 45,000; last row is age 79 maturity.
- [ ] **Step 3: Commit** `feat(ismart80-6): benefit illustration table render`.

---

## Task 16: app.js — PDF / print export

**Files:**
- Modify: `ismart80-6/js/app.js`, `ismart80-6/css/styles.css`

- [ ] **Step 1:** Add a "พิมพ์ / PDF" button that triggers `window.print()`; ensure print CSS paginates per project print conventions.
- [ ] **Step 2:** Manual test: print preview shows clean pages, no URL header (`@page{margin:0}`), benefit table splits cleanly.
- [ ] **Step 3: Commit** `feat(ismart80-6): PDF/print export`.

---

## Task 17: Hub registration + shared menu + cover image

**Files:**
- Modify: root `index.html` (products array, ~line 244)
- Modify: `assets/global-header.js` (menu, if products enumerated there)
- Create: `hub/covers-minimal-v1/ismart80-6.jpg` (cover image)

- [ ] **Step 1:** Add a product object to the `products` array:

```js
{ ready:true, href:"ismart80-6/", kicker:"ประกันชีวิตตลอดชีพ มีเงินคืน", band:"iSmart 80/6",
  tagline:"ชำระเบี้ย 6 ปี คุ้มครองถึงอายุ 80 ปี พร้อมเงินจ่ายคืนรายปี",
  bullets:["เงินคืน 1% (ปี1-5) / 2% (ปีถัดไป)","ครบสัญญารับ 200% ทุนประกัน","คำนวณเบี้ย+ผลประโยชน์ · PDF · A2026-1"],
  isNew:true, gradient:"linear-gradient(135deg,#f8fafc,#eef4ff)",
  image:"hub/covers-minimal-v1/ismart80-6.jpg", icon:ICONS.shield },
```

- [ ] **Step 2:** If `assets/global-header.js` enumerates products, add the iSmart 80/6 link there too.
- [ ] **Step 3:** Add a cover image (reuse an existing minimal cover style; drop a placeholder if no artwork yet, matching dimensions of siblings).
- [ ] **Step 4:** Smoke test: root page renders the new card; clicking it loads `/ismart80-6/`.
- [ ] **Step 5: Commit** `feat(ismart80-6): register on hub + shared menu`.

---

## Task 18: Full validation gate + multi-scenario harness

**Files:**
- Modify: `ismart80-6/scripts/capture_groundtruth.py` (add scenarios), `ismart80-6/scripts/validate.mjs`

- [ ] **Step 1:** Extend ground truth to cover: ages 25/35/44/55/65, both genders, SA tiers 150k/500k/1M/5M, all 4 payment modes, and at least one combination exercising every rider.
- [ ] **Step 2:** Extend `validate.mjs` to loop all scenarios asserting main premium, first-year total, and full benefit table (cashback/accum/death/surrender per year) to the satang.
- [ ] **Step 3:** Run: `node ismart80-6/scripts/validate.mjs` → all PASS. This is the **acceptance gate**; no ship until green.
- [ ] **Step 4: Commit** `test(ismart80-6): full multi-scenario validation gate`.

---

## Task 19: Final review + deploy readiness

- [ ] **Step 1:** Run the full `validate.mjs` once more; confirm PASS.
- [ ] **Step 2:** Manual end-to-end in browser: input → premium → benefit table → PDF, plus PIN gate + header + hub card.
- [ ] **Step 3:** Bump `?v=` on the four script tags to invalidate cache.
- [ ] **Step 4:** Use `superpowers:finishing-a-development-branch` to decide merge/PR per project deploy workflow (advisorx.biz ships from origin/main).

---

## Self-review notes

- **Spec coverage:** premium (T6), cash-back/maturity/death/surrender (T7), riders (T9), calc aggregator (T10), form/validation (T11,T14), benefit table UI (T15), PDF (T16), hub/gate integration (T17,T12), validation gate (T8,T18). All spec §2–§7 covered.
- **Open items:** high-SA discount resolved (no main-plan discount, T6). Package variants (`I14>=5`) deferred — standard 6-pay first (spec §8); add as a follow-up scenario in T18 only if ground truth is available.
- **Type consistency:** `IS80.{rd,rnd,MODES,calcMain,benefitTable,calcRiders,calc}`; row fields `{year,age,premium,cumPrem,cashback,accum,death,deathInclCoupons,surrender}` used identically in T7/T10/T15.
