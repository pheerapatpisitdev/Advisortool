# Agency Blueprint — Vanilla (HTML + CSS + JS)

Standalone static port of the `app/agency` Next.js toolkit. No build step, no
framework, no server, **no `/api` calls** — all calculations run client-side in
the browser. Tailwind is precompiled in `styles.css`; custom Agency Blueprint
theme tokens are declared inline.

## Files

| File | Original source | Purpose |
|------|-----------------|---------|
| `index.html` | `app/agency/page.tsx` | Landing page — 3 tool cards linking to the sub-pages |
| `calculator.html` | `calculator/page.tsx` + `calculator.tsx`, `calculator-form.tsx`, `results-display.tsx`, `hierarchy-chart.tsx` | เครื่องคำนวณค่าบริหาร (commission calculator) |
| `bonus-calculator.html` | `bonus-calculator/page.tsx` + `agent-income-calculator.tsx` | เครื่องมือคำนวนรายได้ตัวแทน (agent income + bonus) |
| `manager-test.html` | `manager-test/page.tsx` + `manager-test-questions.ts` | แบบทดสอบผู้จัดการ (24-question quiz) |
| `agency.js` | `lib/products.ts`, `lib/manager-test-questions.ts`, `lib/formatters.ts`, `ai/flows/agent-income.ts`, `ai/flows/commission.ts` | Shared data + calculation logic (ported 1:1) |
| `logo.png`, `icon.png` | `public/agency/` | Assets |

## Calculation logic (ported, computes locally)

- **Commission** (`commissionCalculator`) — ported from `ai/flows/commission.ts`.
  TOR/ADOR/MDOR per level, TOR rate table by manager tenure + persistency,
  child 2TOR=17.5% / MDOR by unit age, grandchild 3TOR=3.5%.
  Original called `/api/agency/commission`; vanilla computes inline.
- **Agent income** (`agentIncomeCalculator`) — ported from `ai/flows/agent-income.ts`.
  First-year commission, NBC (mode credit), QVB rate table, YEB rate table,
  7-year commission + cumulative income projections.
  Original called `/api/agency/agent-income`; vanilla computes inline.
- **Manager test** — sum of 24 answers (1–5, max 120); ≥96 / ≥72 / else tiers.

### Verified parity (matches source formulas exactly)
- Commission: direct NBC 100,000 (tenure≤12mo, 80% persist, ADOR on) + child 50,000 (≤1yr) + grandchild 20,000 → monthly **74,200**, annual **890,400** (1TOR 35,000, ADOR 21,000, 2TOR/MDOR 8,750 each, 3TOR 700).
- Agent income: APE 100,000, iShield 10 (35%), yearly, 100% → commission 35,000, NBC 36,750, QVB rate 25% → QVB **9,188**, YEB rate 0%, net **44,188**.
- Manager test: 24 × 4 = 96 → top tier "สุดยอดผู้จัดการหน่วย!".

## Notes / parity details

- The **manager-test** intentionally uses a distinct **blue theme** (the original
  page overrides the agency CSS vars inline). Reproduced via inline `:root` vars.
- The **hierarchy chart** in the original is hand-drawn HTML/CSS (NOT recharts —
  recharts is imported but unused). Reproduced with the same flexbox + connector
  lines + node cards. No charting library needed.
- `bonus-calculator.html` supports the same URL params as the original
  (`?ape=&product=&mode=&p=`) and auto-calculates on load when `ape` is present.
- Share buttons: "คัดลอกข้อความ" uses the clipboard API; "แชร์ผ่าน LINE" opens
  `line.me/R/share`. No Supabase / no saving — all calculators are local-only
  (the source has no save call for these tools).

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080/agency/
```
