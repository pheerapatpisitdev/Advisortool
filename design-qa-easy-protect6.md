# Design QA — Easy Protect 6 integration

- Source visual truth: `/Users/pheerapatpisit/Desktop/Easy Protect6/easy-protect-app/qa-calculator-comparison-final.png`, `/Users/pheerapatpisit/Desktop/Easy Protect6/easy-protect-app/qa-rider-comparison-final.png`, `/Users/pheerapatpisit/Desktop/Easy Protect6/easy-protect-app/qa-table-comparison-final.png`, and the interactive chart screenshot attached in the conversation.
- Implementation: `easy-protect6/index.html`, `easy-protect6/styles.css`, and the compiled `easy-protect6/app.js` generated from `easy-protect6/source/`.
- Implementation URL: `http://localhost:8080/easy-protect6/`.
- Implementation screenshot: unavailable because no in-app Browser or connected browser surface is available in this session.
- Intended viewport: desktop reference widths, plus a responsive check at 390 × 844.
- State: male, age 30, annual payment, 500,000 baht sum assured, no riders; calculator and result views.

## Full-view comparison evidence

Blocked. All three source comparison boards can be opened, but a browser-rendered screenshot of the integrated static implementation cannot be captured. A normalized side-by-side comparison is therefore unavailable.

## Focused region comparison evidence

Blocked for the same reason. Planned focused regions are the global Home bar, payment-mode selector, sum-assured/premium pair, rider table, result summary, interactive chart and tooltip, multi-row benefit-table header, and mobile table scroller.

## Findings

- [P1] Browser-rendered fidelity and interaction polish are unverified.
  - Location: Easy Protect 6 calculator and result screens.
  - Evidence: source boards and implementation code are available, but browser selection returned “No browser is available,” so no implementation capture or console inspection could be completed.
  - Impact: Thai wrapping, dense rider controls, benefit-table proportions, and 390 px responsive behavior may still need visual tuning.
  - Fix: capture desktop calculator/result states and the 390 × 844 calculator state in an available browser, compare against the source boards, and fix any visible P0/P1/P2 differences.

## Required fidelity surfaces

- Fonts and typography: IBM Plex Sans Thai and Kanit are configured; deep-blue headings, numeric emphasis, and document-table hierarchy follow the source. Browser rendering is not visually verified.
- Spacing and layout rhythm: the 984 px calculator flow, square bordered controls, document-width results, and dense yearly rows match the selected source structure in code. Browser rendering is not visually verified.
- Colors and visual tokens: white/light-gray surfaces, cobalt selection state, black table rules, and no new decorative gradients are used in the calculator and results.
- Image quality and asset fidelity: the supplied Easy Protect 6 Open Graph artwork is reused on the Home card; no placeholder image was introduced.
- Copy and content: product name, four payment modes, six-year premium term, age-99 protection, supported riders, official-style IRR sentence, yearly benefit headings, and the cash-value-minus-accumulated-premium gain/loss column are present.

## Functional evidence

- Static page and bundle: passed (`HTTP 200`).
- JavaScript bundle syntax: passed.
- Server-side render smoke check: passed; required calculator sections and default premium were present.
- Male age 30, annual, 500,000 baht: passed at 29,750 baht.
- Reverse calculation from 29,750 baht: passed at 500,000 baht.
- Female age 35, annual, 500,000 baht: passed at 30,950 baht.
- Male age 30, monthly, 500,000 baht: passed at 2,677.50 baht per installment.
- Benefit rows for male age 30: passed at 69 rows; six-year accumulated base premium is 178,500 baht and IRR is about 1.56%.
- Chart data: passed — male age 30 produces three 69-point series and the first break-even row is policy year 14.
- Chart render structure: passed — the result render contains the chart heading, canvas, legend, accessible label, and live tooltip markup.
- DOM interaction, responsive rendering, print dialog, and browser console: blocked because no browser surface is available.

## Comparison history

- Iteration 1: reused the validated source formula/data files and translated the source calculator into the existing Advisortool static runtime.
- Iteration 2: aligned the integrated input view with the approved 12PL/LifeReady document language, added the shared Home bar, preserved four payment modes and reverse calculation, changed riders to a continuous table, and made the benefit table full-width with a mobile scroller.
- Iteration 3: reduced the rider section from document width to the same 984 px width as the payment-mode and base-policy sections, while retaining the rider table's contained horizontal scroller on narrow screens.
- Iteration 4: constrained the result summary, premium-summary table, and yearly benefit document to the same 984 px content width as the calculator. The benefit table remains horizontally scrollable on narrow screens.
- Iteration 5: added a seventh yearly-benefit gain/loss column using cash surrender value minus accumulated base premium. Positive values carry a plus sign and green emphasis; negative values remain red for accuracy.
- Iteration 6: removed decimal places from all monetary values in the yearly benefit table while retaining two-decimal precision in the premium summary.
- Iteration 7: shortened the seventh-column heading from gain/loss wording to “กำไร” while retaining the cash-value-minus-accumulated-premium formula beneath it.
- Iteration 8: removed decimal places from the premium-summary table as well, so every monetary table now uses whole-baht display values.
- Iteration 9: added a responsive interactive results chart using the actual yearly rows. It compares accumulated premium, cash surrender value, and death benefit; marks the first break-even year; supports mouse, touch, and keyboard selection; and keeps live whole-baht values in the legend and tooltip.
- Iteration 10: highlighted the first break-even row in pale green and replaced its zero-profit cell with a green “จุดคุ้มทุน” badge, matching the supplied table-row reference.
- Iteration 11: rebuilt print/PDF styling for A4 portrait. The first page uses a compact two-column summary, premium table, and resized chart; the yearly benefit table starts on a new page, repeats its header, and uses portrait-safe seven-column typography.
- Iteration 12: reduced the benefit-document title size on desktop, mobile, and A4 portrait output while preserving its hierarchy above the IRR sentence.
- Post-fix browser evidence: unavailable because browser selection failed.

## Implementation checklist

- Capture desktop calculator and result views.
- Test payment mode, age, sex, reverse premium, each rider family, validation errors, back navigation, chart pointer/touch/keyboard interaction, and print/PDF.
- Capture the 390 × 844 calculator view and verify the rider and benefit-table scrollers.
- Check browser console and fix any P0/P1/P2 differences.

## Follow-up polish

- Tune Thai label wrapping and rider-control density after the first browser capture.
- Adjust yearly table type size only if the reference-width comparison shows a density mismatch.

final result: blocked
