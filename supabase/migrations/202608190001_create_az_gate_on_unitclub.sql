-- PIN gate backend, migrated 2026-08-19 from project yovibeztstpexajpuyyb
-- to project cenysylrzbwfrtuqoeqk (the project named "UnitClub" in the
-- Supabase dashboard). Applied there; the old project is left intact as a
-- rollback target. Keep this file in sync with assets/pin-gate.config.js.

create table if not exists public.az_gate_pins (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.az_gate_access_log (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid references public.az_gate_pins(id) on delete set null,
  label_snapshot text,
  tool text,
  user_agent text,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);

-- Lockout lookup: ip + success + created_at window.
create index if not exists az_gate_access_log_ip_created_idx
  on public.az_gate_access_log (ip, created_at desc) where success = false;

-- RLS on, zero policies: no direct table access for anon/authenticated.
alter table public.az_gate_pins enable row level security;
alter table public.az_gate_access_log enable row level security;

revoke all on table public.az_gate_pins from public, anon, authenticated;
revoke all on table public.az_gate_access_log from public, anon, authenticated;

create or replace function public.az_gate_verify(input_pin text, input_tool text, input_ua text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ip text;
  v_recent_fails int;
  v_match record;
begin
  v_ip := coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown');

  select count(*) into v_recent_fails
  from public.az_gate_access_log
  where ip = v_ip and success = false and created_at > now() - interval '30 seconds';

  if v_recent_fails >= 5 then
    return jsonb_build_object('ok', false, 'locked', true);
  end if;

  select id, label into v_match
  from public.az_gate_pins
  where active = true and pin_hash = extensions.crypt(input_pin, pin_hash)
  limit 1;

  insert into public.az_gate_access_log (pin_id, label_snapshot, tool, user_agent, ip, success)
  values (v_match.id, v_match.label, input_tool, input_ua, v_ip, v_match.id is not null);

  if v_match.id is not null then
    return jsonb_build_object('ok', true);
  else
    return jsonb_build_object('ok', false, 'locked', false);
  end if;
end;
$function$;

-- Postgres grants EXECUTE to PUBLIC by default on new functions; restrict to anon.
revoke all on function public.az_gate_verify(text, text, text) from public, authenticated;
grant execute on function public.az_gate_verify(text, text, text) to anon;
