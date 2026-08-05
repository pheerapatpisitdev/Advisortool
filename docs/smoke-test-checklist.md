# Advisortool smoke-test checklist

## Repeatable local checks

Run from the repository root:

```bash
npm test
```

The static smoke suite checks all 14 primary entry pages for:

- shared PIN config/gate ordering and shared header asset versions;
- missing local `src`/`href` assets;
- source/version/disclaimer metadata coverage and print hiding;
- expected print/PDF/image-export and LINE share hooks;
- absence of silent FHC/Career-Agent persistence.

The PIN suite separately verifies server approval, server denial, network
failure, missing configuration, and removal of a browser-side PIN fallback.

## Manual release checks still required

Static tests cannot prove browser rendering, operating-system share sheets, or
the content of generated files. Before a production release, serve the repo
over HTTP and test at least Safari on iPhone/iPad plus Chrome on desktop:

1. Open the Hub and every tool card; confirm no blank page, clipped header, or
   missing primary image/style at desktop and narrow mobile widths.
2. Confirm a valid server PIN unlocks and invalid/offline verification remains
   locked. Confirm the metadata dialog opens, scrolls, closes with Escape/tap,
   and returns focus to its button.
3. For every visible print/PDF/image button, generate the output and inspect all
   pages for clipping, blank trailing pages, unreadable colors, missing Thai
   fonts, repeated headers, and stale values.
4. For every LINE button, stop before sending and confirm the OS/app share flow
   opens only after a user gesture, uses encoded text, and includes no fields
   the user did not intend to share.
5. On iOS standalone/PWA mode, confirm the print helper explains that Safari is
   required instead of failing silently.
6. Exercise empty, minimum, maximum, and invalid inputs; verify the page shows a
   useful inline error, keeps the user's values, and does not produce `NaN`,
   `Infinity`, negative premiums, or a disabled button that never recovers.

Record browser/OS versions, tool, scenario, output filename, and pass/fail in
the release ticket. Product-rate correctness remains a separate owner review
against current authoritative product documents.
