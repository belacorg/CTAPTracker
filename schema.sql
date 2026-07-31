-- CTAP Tracker – Supabase schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

-- ── users_profile ──────────────────────────────────────────────────────────
create table if not exists public.users_profile (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text not null default '',
  base_hours       numeric not null default 40,
  weekly_target_pct numeric not null default 0.8,
  starting_balance numeric not null default 0,
  theme            text not null default 'dark',
  coach_mode       boolean not null default false,
  checkin_enabled  boolean not null default true,
  migration_complete boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- `create table if not exists` above skips existing installs, so new columns
-- need spelling out separately. Safe to re-run.
alter table public.users_profile
  add column if not exists checkin_enabled boolean not null default true;

alter table public.users_profile enable row level security;

create policy "users_profile: own row only"
  on public.users_profile
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── weeks ──────────────────────────────────────────────────────────────────
create table if not exists public.weeks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  week_key         text not null,           -- 'YYYY-MM-DD' (Monday)
  deduction_mins   integer not null default 0,
  exclude_from_ctap boolean not null default false,
  shifts_json      jsonb not null default '{}',
  mentor_days_json jsonb not null default '{}',
  deductions_json  jsonb not null default '[]',
  notes            text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id, week_key)
);

alter table public.weeks enable row level security;

create policy "weeks: own rows only"
  on public.weeks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists weeks_user_id_week_key on public.weeks(user_id, week_key);

-- ── job_logs ───────────────────────────────────────────────────────────────
create table if not exists public.job_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  week_key         text not null,
  day_key          text not null,           -- 'YYYY-MM-DD'
  job_id           text not null,
  job_name         text not null default '',
  credit_mins      integer not null default 0,
  variable_value   numeric,
  logged_at        timestamptz not null default now(),
  sort_order       integer not null default 0
);

alter table public.job_logs enable row level security;

create policy "job_logs: own rows only"
  on public.job_logs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists job_logs_user_week on public.job_logs(user_id, week_key);
create index if not exists job_logs_user_day  on public.job_logs(user_id, day_key);

-- ── checkins ───────────────────────────────────────────────────────────────
-- The daily check-in diary. Self-facing only: there is deliberately no policy
-- here granting anyone but the author read access, and no service-role view
-- aggregating across engineers. If a future requirement asks for one, that is
-- a change to what this feature IS, not a schema tweak — see ADR-0012.
--
-- There is no column for a customer name, address, or job reference. That is a
-- deliberate omission, not an oversight: the schema is the enforcement point,
-- so the data cannot exist even if the UI is bypassed.
--
-- One row per answer. A day the engineer answers fully writes three rows: two
-- factor ratings (factor_tag set, rating set) and one reflection note
-- (factor_tag null, prompt_id set). Anything can be skipped, so any of those
-- rows may be absent and `rating` may be null on a row that exists.
create table if not exists public.checkins (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  day_key          date not null,
  factor_tag       text,
  rating           text,
  prompt_id        text,
  reflection_note  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint checkins_factor_tag_known check (
    factor_tag is null or factor_tag in
      ('van_tools', 'safety_first', 'process', 'fault_finding', 'customer')
  ),
  -- Three-way, never binary. A forced yes/no on a middling day gets skipped or
  -- answered dishonestly, so 'mid' is a first-class answer.
  constraint checkins_rating_known check (
    rating is null or rating in ('no', 'mid', 'yes')
  ),
  -- Short by design: this is a feeling, not an incident report. A long note is
  -- where job detail starts creeping in.
  constraint checkins_note_short check (
    reflection_note is null or char_length(reflection_note) <= 280
  )
);

alter table public.checkins enable row level security;

create policy "checkins: own rows only"
  on public.checkins
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- coalesce rather than `nulls not distinct` so this works on any PG version:
-- the reflection row (factor_tag null) still gets exactly one slot per day.
create unique index if not exists checkins_user_day_factor
  on public.checkins(user_id, day_key, coalesce(factor_tag, ''));

create index if not exists checkins_user_day on public.checkins(user_id, day_key);

-- ── updated_at trigger (shared function) ───────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger users_profile_updated_at
  before update on public.users_profile
  for each row execute procedure public.set_updated_at();

create or replace trigger weeks_updated_at
  before update on public.weeks
  for each row execute procedure public.set_updated_at();

create or replace trigger checkins_updated_at
  before update on public.checkins
  for each row execute procedure public.set_updated_at();
