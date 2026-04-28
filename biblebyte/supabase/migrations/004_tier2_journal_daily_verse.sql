-- Tier 2: prayer journal, reflection journal entries, global daily verse placeholders.

do $$
begin
  create type public.prayer_status as enum ('asked', 'waiting', 'answered');
exception
  when duplicate_object then null;
end $$;

create table public.prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  request text not null,
  notes text,
  status public.prayer_status not null default 'asked',
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prayers enable row level security;

create policy "Users manage own prayers"
  on public.prayers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.prayers is 'User prayer requests with lifecycle states; no copyrighted scripture stored here by default.';

-- ---------------------------------------------------------------------------

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  kind text not null check (kind in ('reflection', 'gratitude', 'insight')),
  body text not null,
  entry_date date not null default ((timezone('utc', now()))::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "Users manage own journal entries"
  on public.journal_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.journal_entries is 'Reflection / gratitude / insight entries separate from Home daily_reflections card if desired.';

-- ---------------------------------------------------------------------------
-- Global verse-of-day placeholders (same rows for all users; licensing-safe copy).
-- ---------------------------------------------------------------------------

create table public.daily_verses (
  verse_date date primary key,
  reference text not null,
  body_placeholder text not null,
  attribution_note text default 'Placeholder until publisher licensing.',
  created_at timestamptz not null default now()
);

alter table public.daily_verses enable row level security;

create policy "Authenticated users read daily verses"
  on public.daily_verses
  for select
  to authenticated
  using (true);

comment on table public.daily_verses is 'Admin-seeded rotating placeholders; replace bodies with licensed API when cleared.';

-- Seed ~90 UTC calendar days forward from migration date (idempotent per date).
do $$
declare
  d date := (timezone('utc', now()))::date;
  refs text[] := array[
    'John 3:16', 'Psalm 23:1–3', 'Romans 8:28', 'Philippians 4:6–7',
    'Isaiah 41:10', 'Matthew 11:28–30', 'Psalm 46:10', 'Jeremiah 29:11'
  ];
  i int := 0;
begin
  while i < 90 loop
    insert into public.daily_verses (verse_date, reference, body_placeholder, attribution_note)
    values (
      d + i,
      refs[(i % array_length(refs, 1)) + 1] || ' (placeholder)',
      'Placeholder devotional verse body — connect licensed scripture delivery before release. This row rotates references by calendar day.',
      'TODO[NIV_LICENSE]: Replace with licensed passage payload.'
    )
    on conflict (verse_date) do nothing;
    i := i + 1;
  end loop;
end $$;
