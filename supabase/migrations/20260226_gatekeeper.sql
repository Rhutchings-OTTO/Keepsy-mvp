-- Keepsy Gatekeeper baseline schema
-- Run this in Supabase SQL editor (or migration tooling) before enabling production guardrails.

create table if not exists public.user_profiles (
  user_key text primary key,
  tier text not null default 'free' check (tier in ('free', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_usage (
  user_key text not null,
  day_key date not null,
  used_today integer not null default 0,
  last_request_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_key, day_key)
);

create table if not exists public.deletion_requests (
  id bigserial primary key,
  user_key text not null,
  email text null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'rejected')),
  created_at timestamptz not null default now()
);

create or replace function public.check_and_increment_usage(
  p_user_key text,
  p_tier text,
  p_min_interval_ms integer,
  p_daily_cap integer
)
returns table(
  allowed boolean,
  error text
)
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_today date := current_date;
  v_last_request_at timestamptz;
  v_used_today integer;
begin
  insert into public.daily_usage (user_key, day_key, used_today, last_request_at)
  values (p_user_key, v_today, 0, to_timestamp(0))
  on conflict (user_key, day_key) do nothing;

  select last_request_at, used_today
    into v_last_request_at, v_used_today
  from public.daily_usage
  where user_key = p_user_key and day_key = v_today
  for update;

  if extract(epoch from (v_now - v_last_request_at)) * 1000 < p_min_interval_ms then
    return query select false, 'Please wait a few seconds before generating again.';
    return;
  end if;

  if v_used_today >= p_daily_cap then
    return query select false, format('Daily generation limit reached (%s).', p_daily_cap);
    return;
  end if;

  update public.daily_usage
  set
    used_today = used_today + 1,
    last_request_at = v_now,
    updated_at = v_now
  where user_key = p_user_key and day_key = v_today;

  insert into public.user_profiles (user_key, tier)
  values (p_user_key, case when p_tier = 'paid' then 'paid' else 'free' end)
  on conflict (user_key) do update
    set updated_at = now();

  return query select true, null::text;
end;
$$;
