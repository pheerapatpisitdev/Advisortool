# Group Insurance — vanilla static page

Standalone vanilla HTML + CSS + JS port of the `app/group-insurance` Next.js/React tool.
No build step, no framework, no server-side code.

## Run

Open over HTTP (needed so the images load with correct paths and html2canvas can read them):

```
cd vanilla/group-insurance
python3 -m http.server 8852
# open http://localhost:8852/index.html
```

## Files

- `index.html` — shell: Tailwind Play CDN (with custom teal theme tokens), ported `index.css`,
  loads jsPDF + html2canvas from CDN, then `data.js`, `translations.js`, `app.js`.
- `app.js` — full app: state object + `render()` pattern (mirrors the React tree). Sidebar,
  3 pages (Group Health, Group PA, Business Type), the multi-group premium calculator,
  TH/EN language toggle (persisted to `localStorage` under `group-insurance-lang`),
  LINE share, and the PDF quote modal/document.
- `data.js` — `window.GI_DATA`: premium tables (`healthIpdPremiums`, `healthOpdPremiums`,
  `paMainPremiums`, `paMePremiums`), benefit tables, biz types, and the 1,099-row
  `businessTypes` list. Generated from `_src/data/insuranceData.js` + `_src/data/businessTypes.js`.
- `translations.js` — `window.GI_TRANSLATIONS` (TH/EN), ported from `_src/i18n/translations.js`.
- Images: `logo.png`, `coffee-cup-logo.png`, `promptpay-donate.png`,
  `health.png` / `health-en.png` (Health page header, from `_src/assets`),
  `PA.png` / `PA-EN.png` (PA page header, from `public/group-insurance`, the `  EN` double-space
  renamed to `-EN`).

## Parity notes

- Premium math is a 1:1 port of `utils/multiGroupQuote.js`:
  band is derived from the **total** people across all groups; biz type / plan / rider are
  per-group; OPD does not depend on band, ME does. Verified numbers, e.g.
  Health biz1 / 10 people / P1+OPD1 → 4,241 per person, 42,410 subtotal;
  PA biz1 / 5 people / P1+ME10k → 380 per person, 1,900 subtotal.
- The PDF quote replicates `MultiGroupQuoteDocument.jsx` (A4 794px layout), rasterized with
  html2canvas and paginated into A4 via jsPDF — same approach as `utils/quotePdf.js`
  (view / print / download). The single-group `QuoteDocument.jsx` is unused by the calculator,
  so it is not ported.
- The count input recalculates live while keeping caret/focus (re-render + focus restore).

## Not included

No Supabase / save / backend calls exist in the source, so none are present here.
The "Download Documents" button (PA page) and DBD link are external links, kept as-is.
