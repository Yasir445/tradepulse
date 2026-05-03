-- ═══════════════════════════════════════════════════
-- TRADEPULSE — SUPABASE DATABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════

-- PROFILES (auto-created on signup)
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text,
  instrument    text,
  prop_firm     text,
  timezone      text default 'PKT',
  created_at    timestamp with time zone default timezone('utc', now())
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, instrument, prop_firm)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'instrument',
    new.raw_user_meta_data->>'prop_firm'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRADES
create table if not exists public.trades (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users on delete cascade not null,

  -- Basic info
  instrument      text,                          -- NQ, ES
  direction       text check (direction in ('LONG','SHORT')),
  outcome         text check (outcome in ('WIN','LOSS','BE','RUNNING')),
  grade           text,                          -- A++, A+, A, B, C, D, F

  -- Prices
  entry_price     numeric,
  sl_price        numeric,
  tp_price        numeric,
  exit_price      numeric,
  rr              numeric,                       -- risk:reward achieved

  -- Context
  session         text,                          -- NY Open, London
  day_of_week     text,                          -- Mon, Tue...
  cycle_context   text,                          -- Free text
  narrative       text,                          -- Trade narrative

  -- 5-Step checklist (boolean per step)
  step1_4h_tpd       boolean default false,
  step2_daily_smt    boolean default false,
  step3_90m_smt      boolean default false,
  step4_m5_tpd       boolean default false,
  step5_true_opens   boolean default false,

  -- Bonus confluences
  bonus_weekly_smt   boolean default false,
  bonus_1h_gap       boolean default false,
  bonus_lrlr         boolean default false,

  -- SL rules
  sl_on_swing        boolean default false,
  no_premature_be    boolean default false,
  correct_risk       boolean default false,

  -- Post-trade review
  execution_rating   integer check (execution_rating between 1 and 10),
  emotional_rating   integer check (emotional_rating between 1 and 10),
  mistakes           text[],                     -- array of mistake tags
  rule_violation     text,
  would_take_again   text check (would_take_again in ('YES','NO','MAYBE')),
  lesson             text,
  ideal_entry        text,

  -- Screenshot (stored in Supabase Storage)
  chart_url          text,

  -- Metadata
  trade_date         date default current_date,
  created_at         timestamp with time zone default timezone('utc', now()),
  updated_at         timestamp with time zone default timezone('utc', now())
);

-- CHECKLIST SESSIONS (saved pre-trade checks)
create table if not exists public.checklist_sessions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  day         text,
  session     text,
  news_type   text,
  bias        text,
  steps       jsonb,           -- { step1: true, step2: false, ... }
  grade       text,
  score_pct   integer,
  notes       text,
  created_at  timestamp with time zone default timezone('utc', now())
);

-- ROW LEVEL SECURITY — users only see their own data
alter table public.profiles          enable row level security;
alter table public.trades            enable row level security;
alter table public.checklist_sessions enable row level security;

create policy "Users own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users own trades"
  on public.trades for all using (auth.uid() = user_id);

create policy "Users own checklists"
  on public.checklist_sessions for all using (auth.uid() = user_id);

-- STORAGE BUCKET for chart screenshots
insert into storage.buckets (id, name, public)
  values ('charts', 'charts', false)
  on conflict do nothing;

create policy "Users manage own charts"
  on storage.objects for all
  using (bucket_id = 'charts' and auth.uid()::text = (storage.foldername(name))[1]);
