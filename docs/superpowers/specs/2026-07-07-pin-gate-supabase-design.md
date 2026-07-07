# PIN Gate → Supabase-Verified Access Design

## Problem

The current PIN gate (`assets/pin-gate.{config,js,css}`, shared by all 14 tool pages) is a pure client-side check: the valid 6-digit PINs live in `assets/pin-gate.config.js` as plain text, readable by anyone via view-source, DevTools, or `window.PIN_GATE_CONFIG.pins` in the console. It cannot be made unhackable without moving verification server-side. Separately, there is no record anywhere of who unlocked a page, when, or from what device.

## Goals

1. Move PIN verification to the server (Supabase) so the real PIN values are never shipped to the browser.
2. Record every unlock attempt (success and failure) with a human-readable label, timestamp, tool, device (user-agent), and IP.
3. Provision one PIN per person, seeded from the existing 65-member roster in the **83G30M** Supabase project (`agents` table), not the original 8 anonymous PINs.
4. Add real server-side brute-force protection (client-side lockouts can be bypassed by anyone scripting requests directly).

## Non-goals

- No new admin UI in AdvisorTool for viewing the log — viewed directly via Supabase Table Editor.
- No change to the 12h idle-unlock / localStorage UX once a PIN is verified.
- Not fixing the unrelated `agents` table RLS exposure in 83G30M (flagged separately to the user; out of scope here).

## Target project

Supabase project **83G30M** (`yovibeztstpexajpuyyb`) — reusing this existing project per user decision, NOT the separate `AdvisorTool` Supabase project referenced for career/fhc response tables. New objects are namespaced `az_gate_*` to avoid clashing with the 37 existing tables.

## Data model

```sql
create extension if not exists pgcrypto;

create table az_gate_pins (
  id uuid primary key default gen_random_uuid(),
  label text not null,             -- person's name, seeded from agents.name
  source_agent_id uuid,            -- informational only, not a live FK (decoupled from agents table)
  pin_hash text not null,          -- crypt(pin, gen_salt('bf'))
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table az_gate_access_log (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid references az_gate_pins(id) on delete set null,
  label_snapshot text,             -- copied at insert time so log stays readable if pin is later deactivated/renamed
  tool text,                       -- which page, e.g. "ihealthy", "career-agent"
  user_agent text,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);
```

RLS enabled on both tables with **no policies granted to `anon` or `authenticated`** — the only access path is the `security definer` RPC below (and the project owner via the dashboard/service role).

## RPC: `az_gate_verify(input_pin, input_tool, input_ua)`

1. Reads caller IP from the PostgREST request header GUC.
2. Counts failed attempts from that IP in the last 30s; if ≥ 5, returns `{ok:false, locked:true}` without even checking the PIN. This is enforced in the database, so it can't be bypassed by scripting requests directly at the RPC endpoint (unlike the current client-side JS counter).
3. Looks up an `active` row where `crypt(input_pin, pin_hash) = pin_hash`.
4. Inserts one row into `az_gate_access_log` regardless of outcome.
5. Returns `{ok:true}` or `{ok:false, locked:false}` — never the PIN list itself.

`grant execute` to `anon`; `revoke all` direct table privileges from `anon`/`authenticated` on both tables.

## Client changes (`assets/pin-gate.js`, shared by all 14 pages)

- Add `assets/supabase.min.js` — self-hosted `@supabase/supabase-js` UMD build (same pattern previously used by `career-agent/supabase.min.js` before it was removed).
- `pin-gate.config.js` drops the `pins: [...]` array entirely; adds `SUPABASE_URL` + the 83G30M publishable/anon key (safe to embed — same class of key already used elsewhere in the codebase).
- `submit()` becomes async: calls `supabase.rpc('az_gate_verify', {input_pin, input_tool, input_ua})` instead of `PINS.indexOf(entered)`. Adds a brief loading state on the keypad while awaiting the response.
- The existing 5-attempts/30s client-side lockout UI stays as-is for instant UX feedback — it's now a courtesy layer, not the real security boundary (the RPC enforces the real one).
- Everything after a successful unlock (localStorage `az_gate`, 12h sliding idle timeout, floating lock button) is unchanged.

## Migration (one-time, run via Supabase MCP, not committed to git)

1. Pull `name` from `agents` in 83G30M (65 rows).
2. Generate one unique random 6-digit PIN per agent (collisions re-rolled).
3. Insert into `az_gate_pins` with `pin_hash = crypt(<generated pin>, gen_salt('bf'))`.
4. The plaintext name→PIN mapping is handed to the user directly in the chat response (and/or a local, gitignored file) for manual distribution — it cannot be recovered later since only the hash is stored.
5. The original 8 anonymous PINs are retired (not migrated forward) since this is a full upgrade to named, per-person credentials.

## Trade-offs / limitations accepted

- Unlocking now requires network connectivity (previously worked fully offline once the page loaded).
- Slight latency on submit (one network round trip to Supabase).
- `az_gate_pins.source_agent_id` is a point-in-time snapshot, not a live link — if someone leaves the 83G30M roster, their AdvisorTool PIN must be deactivated separately (`active = false`) in `az_gate_pins`; it does not happen automatically.

## Separately flagged (not part of this work)

The `agents` table in 83G30M currently grants `anon` full SELECT/INSERT/UPDATE/DELETE (`qual: true`) — meaning all 65 agents' data is publicly readable and writable by anyone with the project's anon key. This is unrelated to AdvisorTool but was discovered during this investigation and is worth the user's attention separately.
