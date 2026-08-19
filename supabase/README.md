# PIN gate backend deployment

The browser PIN gate calls `public.az_gate_verify(text, text, text)` with the
Supabase publishable key configured in `assets/pin-gate.config.js`. The browser
now fails closed: there is no offline or client-side PIN fallback.

Current project: `cenysylrzbwfrtuqoeqk` (named "UnitClub" in the dashboard).
Moved there on 2026-08-19 from `yovibeztstpexajpuyyb`, which still holds a copy
of `az_gate_pins` and `az_gate_access_log` as a rollback target. The gate tables
share that project with an unrelated application, so scope every future
migration to the `az_gate_*` objects.

Before deploying the updated static files:

1. Apply `migrations/202608190001_create_az_gate_on_unitclub.sql` to the target
   Supabase project through an authorized migration workflow or the SQL editor.
2. Confirm `az_gate_pins` and `az_gate_access_log` have RLS enabled and no direct
   grants to `PUBLIC`, `anon`, or `authenticated`.
3. Confirm only `anon` can execute `az_gate_verify`; its response must remain
   limited to the `ok` and `locked` status fields.
4. Rotate every PIN that has ever appeared in repository files or Git history.
   Generate and distribute replacements outside Git, and store only bcrypt
   hashes in `az_gate_pins`. Do not put plaintext PINs in source or logs.
5. Deploy `assets/pin-gate.config.js` and `assets/pin-gate.js` together, then
   hard-refresh an already-open page to avoid stale cached gate code.

This gate controls the user interface of a static site; it does not prevent
direct downloads of publicly hosted HTML, JavaScript, or rate data. If those
assets require true confidentiality, put the site behind authentication at the
hosting/CDN layer (or an authenticated server), not only a browser script.
