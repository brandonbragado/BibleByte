-- Tier 1: last-read Bible position + companion session timestamps.
-- Run after 002_daily_reflections_entry_date.sql.

-- ---------------------------------------------------------------------------
-- Last reading location (one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.reading_positions (
  user_id uuid primary key references public.user_profiles (id) on delete cascade,
  book_code text not null,
  chapter integer not null check (chapter >= 1),
  verse integer not null default 1 check (verse >= 1),
  updated_at timestamptz not null default now()
);

alter table public.reading_positions enable row level security;

create policy "Users manage own reading position"
  on public.reading_positions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.reading_positions is 'Last-opened Bible passage (codes align with client canon; no copyrighted text stored).';

-- ---------------------------------------------------------------------------
-- Companion sessions: track last activity for ordering
-- ---------------------------------------------------------------------------
alter table public.chat_sessions
  add column if not exists updated_at timestamptz not null default now();

update public.chat_sessions
set updated_at = coalesce(updated_at, created_at);
