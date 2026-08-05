-- Apply to the Supabase project used by assets/pin-gate.config.js.
-- The browser uses the anon role; no role needs direct table access.

alter table if exists public.az_gate_pins enable row level security;
alter table if exists public.az_gate_access_log enable row level security;

revoke all on table public.az_gate_pins from public, anon, authenticated;
revoke all on table public.az_gate_access_log from public, anon, authenticated;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Restrict the
-- security-definer verifier to the role used by this static site's publishable key.
revoke all on function public.az_gate_verify(text, text, text) from public, authenticated;
grant execute on function public.az_gate_verify(text, text, text) to anon;
