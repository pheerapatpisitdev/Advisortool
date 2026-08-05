# Global Savings Plus 15/8 — standalone vanilla build

Static HTML/CSS/JS conversion of the React tool at `app/global-saving/`. No build step, no
framework, no server-side code. Open `index.html` in any browser (or serve the folder).

## Files
- `index.html` — everything: ported CSS (from `_src/index.css` + `_src/components/Factsheet.css`),
  the two views (calculator + factsheet), hash router, and all view logic.
- `data.js` — the financial engine ported **verbatim** from `_src/engine.ts` and `_src/surr158.ts`
  (products, surrender-value table, `calc`, `bankCompare`, IRR bisection, `SCEN`, `fmt`), plus the
  factsheet dataset extracted from `_src/components/Documents.tsx`.

## Views (hash routing, matches App.tsx)
- `#calc` (default) — **เครื่องคำนวณ**: premium↔sum-assured calculator, 5 index scenarios
  (-1%/+2%/+3%/+4%/+5%) plus two bank-deposit comparison columns, KPI cards, benefit table,
  stacked bar chart, year-by-year table, tax-deduction column, and disclaimers.
- `#docs` — **เอกสารการลงทุน**: Citi Grandmaster RC 5 Index factsheet (donut allocation chart,
  index line chart with event bands, annual-returns bar chart + table). Built with Chart.js.

## Dependencies
- Chart.js is stored locally as `chart.umd.js`.
- Google Fonts supplies IBM Plex Sans Thai + Sarabun; system-font fallbacks remain usable if fonts cannot load.

## Notes / parity
- Engine ported character-for-character (TS → plain ES5-style JS). Verified numerically: default
  inputs (เบี้ย 50,000, อายุ 35) → SA 50,051; guaranteed total 407,916; IRR 0.17%→5.83% across the
  five scenarios; bank-compare totals 411,659 / 474,977. These are computed by the same formulas as
  the React source, so the numbers match by construction.
- Calculator updates output nodes on each keystroke without rebuilding the focused `<input>`
  (guards on `document.activeElement`) so the cursor/focus is preserved during live recalc.
- No Tailwind needed — the source uses its own plain CSS, ported inline.
- No Supabase / save calls exist in this tool (none in source); nothing to wire up.
- `_src/data/documents.ts` (a `DOCUMENTS` PDF list) is **dead code** in the React app — `App.tsx`
  renders the Factsheet `Documents` component, not a doc list — so it was intentionally not ported.
