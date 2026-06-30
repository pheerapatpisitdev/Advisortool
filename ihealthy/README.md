# iHealthy Ultra — vanilla static page

Standalone HTML/CSS/JS conversion of the Next.js `/ihealthy` tool
(health-insurance plan comparison + per-person premium calculator).

## Files
- `index.html` — entire UI + logic (state object + `render()`), Tailwind via CDN with the
  app's custom theme tokens (brand colors + shadcn HSL tokens) re-declared in `tailwind.config`.
- `data.js` — auto-extracted, byte-for-byte from the source TS:
  - `window.IH_PREMIUM` — full premium tables (smart/bronze/silver/gold × male/female × age 6–80) from `premium-data.ts`
  - `window.IH_PLAN_DETAILS`, `window.IH_BENEFIT_DATA` — from `data.ts`
  - `window.IH_TRANSLATIONS` — 83 i18n keys × 5 languages from `language-context.tsx`
- assets copied from `public/ihealthy/`: `coffee-cup-logo.png`, `profile-header.png`,
  `promptpay-donate.png`, `manifest.json`.

## Run
```
python3 -m http.server 8854
# open http://localhost:8854/index.html
```
(Open via a server, not file://, so `data.js` + html2canvas CDN load correctly.)

## Features (full parity)
- Gender / age (6–80) / payment frequency selectors with live recalc.
- Premium calculation identical to `lib/data.ts` (`yearly`, `six-monthly` ×0.52, `monthly` ×0.09, `Math.round`; nearest-lower-age fallback).
- Age 6–10 shows SMART + BRONZE columns; otherwise BRONZE / SILVER / GOLD.
- Detailed benefits table with the same vertical/horizontal cell-merging of identical
  `AS_INCURRED` / `NOT_COVERED` runs, sub-benefit lists, daily-cash (id 20) hidden for age ≥ 66.
- TH / EN / RU / ZH / FR language dropdown (re-renders + persists to localStorage `app-language`,
  auto-detects browser language on load).
- Share to LINE (same summary text builder), Share-as-Image (html2canvas CDN), Print/Save PDF (`window.print`), waiting-period section.

## Notes
- No chart: the source `chart.tsx` is part of the unused shadcn `ui/*` library and is not rendered by the page, so none was added.
- No PDF library: source "Print PDF" uses the browser print dialog (`window.print()`), reproduced as-is. jspdf is not used by this tool.
- No Supabase / save calls exist in this tool — nothing to port.
