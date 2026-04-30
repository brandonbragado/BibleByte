-- Prayer rhythm: daily check-ins (not prayer *requests* — those stay in `prayers`).
-- `local_date` is the user's calendar day in their own timezone (client sends YYYY-MM-DD).

create table if not exists public.prayer_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  local_date date not null,
  logged_at timestamptz not null default now(),
  note text,
  unique (user_id, local_date)
);

create index if not exists prayer_check_ins_user_date_idx
  on public.prayer_check_ins (user_id, local_date desc);

alter table public.prayer_check_ins enable row level security;

create policy "Users manage own prayer check-ins"
  on public.prayer_check_ins
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.prayer_check_ins is 'Daily "I prayed" marks; local_date is user-local calendar day from the client.';

-- Highest milestone celebration already shown: 0 | 7 | 14 | 30 | 90 (threshold day-counts).
alter table public.user_profiles
  add column if not exists prayer_milestone_celebrated smallint not null default 0;

comment on column public.user_profiles.prayer_milestone_celebrated is 'Largest milestone (7/14/30/90) for which inline celebration was shown; 0 = none.';
