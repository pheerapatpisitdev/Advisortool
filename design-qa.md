# Design QA — LifeTreasure Easy Protect 6 theme

- Source visual truth: the integrated Easy Protect 6 calculator and result implementation at `easy-protect6/`, including its 984 px form/result width, cobalt segmented controls, square white fields, light document table, break-even treatment, chart palette, and A4 portrait print rules.
- Implementation: `life-treasure/index.html`.
- Implementation URL: `http://localhost:8080/life-treasure/`.
- Intended viewports: desktop reference width and responsive mobile width at 390 × 844.
- State: male, age 35, annual payment, 18-year premium plan, 10,000,000 baht sum assured, no riders.
- Implementation screenshot: unavailable because no in-app Browser or connected browser surface is available in this session.

## Comparison evidence

Blocked. The source implementation and LifeTreasure implementation code are available, but the browser connection returned “No browser is available.” A normalized side-by-side screenshot comparison cannot be produced in this session.

## Findings

- [P1] Browser-rendered fidelity and interaction polish remain unverified.
  - Location: LifeTreasure calculator, rider section, results, chart, benefit table, mobile layout, and print preview.
  - Evidence: source and implementation CSS/DOM were inspected, but no rendered capture or browser console was available.
  - Impact: Thai line wrapping, dense rider controls, tooltip positioning, and print pagination may still need visual tuning.
  - Fix: capture calculator/result screens at desktop width and 390 × 844, compare them beside Easy Protect 6, and resolve visible P0/P1/P2 differences.

## Required fidelity surfaces

- Typography: Kanit headings and IBM Plex Sans Thai body copy match Easy Protect 6.
- Layout: 984 px form, rider, summary, chart, and benefit-table content width; responsive single-column mobile flow.
- Visual tokens: light-gray page, white square surfaces, cobalt selection states, neutral gray borders, black table rules, green break-even state, and no decorative dark gradients.
- Navigation: shared Home bar plus a persistent two-step calculator/result indicator.
- Results: cobalt total card, light premium summary, interactive three-series chart, and full benefit table.
- Print/PDF: explicit A4 portrait page size with exact color printing and a compact two-page quote.

## Functional evidence

- HTML inline JavaScript syntax: passed for all three script blocks.
- CSS delimiter check: passed at 337 opening and 337 closing braces.
- Static route: passed (`HTTP 200`).
- Legacy route compatibility: passed — both `LifeTreasure/` and `LifeTreasure/ไลฟ์เทรเชอร์-คำนวณเบี้ย.html` now resolve to the new light theme, and the Home-card URL includes a cache-busting version.
- Default calculation: passed — male age 35, annual, 18-year plan, 10,000,000 baht sum assured produces a 274,000 baht main premium and 64 benefit rows.
- Default benefit endpoints: passed — policy year 1 has 274,000 baht annual premium and 10,000,000 baht death protection; policy year 64 has 10,000,000 baht cash value and death protection.
- Theme behaviors in code: passed — step-state switching, updated case line, break-even badge, light chart palette, shared print helper, and A4 portrait rule are present.
- DOM interaction, responsive rendering, print preview, and browser console: blocked because no browser surface is available.

## Comparison history

- Iteration 1: replaced the dark gold/black visual system with Easy Protect 6 light-gray, white, and cobalt tokens while retaining the LifeTreasure engine and rider rules.
- Iteration 2: aligned header, shared Home bar, step indicator, form width, section spacing, square inputs, segmented controls, rider rows, and action bar with Easy Protect 6.
- Iteration 3: rebuilt the result hierarchy with a cobalt premium card, light premium list, 984 px chart/table widths, whole-baht table values, green break-even row and badge, and Easy Protect 6 chart colors.
- Iteration 4: updated print/PDF styling to A4 portrait and aligned printed headings and table accents with the cobalt theme.
- Iteration 5: diagnosed a duplicate legacy LifeTreasure page that still served the former black/gold theme, synchronized the new implementation to that filename, added a folder-level redirect, and versioned the Home-card link to prevent a stale cached page.

## Follow-up checklist

- Capture and compare desktop calculator and result states.
- Verify each rider family, validation state, reverse premium calculation, back navigation, chart mouse/touch behavior, and print preview.
- Capture 390 × 844 and confirm horizontal table scrolling and dense rider-control wrapping.

final result: blocked
