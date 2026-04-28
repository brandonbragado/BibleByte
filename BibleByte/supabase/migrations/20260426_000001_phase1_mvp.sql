-- BibleByte Phase 1 MVP schema (Supabase/Postgres)
-- TODO[NIV_LICENSE]: keep scripture content placeholder-safe until licensing is secured.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  goal text not null,
  preferred_topics text[] not null default '{}',
  daily_reminder_time time not null,
  analytics_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bible_books (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  order_index int not null,
  testament text not null check (testament in ('old', 'new'))
);

create table if not exists public.bible_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.bible_books(id) on delete cascade,
  chapter_number int not null check (chapter_number > 0),
  unique (book_id, chapter_number)
);

create table if not exists public.bible_verses (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.bible_chapters(id) on delete cascade,
  verse_number int not null check (verse_number > 0),
  verse_text text not null,
  translation text not null default 'NIV',
  is_placeholder boolean not null default true,
  unique (chapter_id, verse_number),
  constraint bible_verses_niv_only check (translation = 'NIV')
);

create table if not exists public.daily_bytes (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  verse_reference text not null,
  verse_text text not null,
  summary text not null,
  reflection_question text not null,
  prayer_prompt text not null,
  estimated_minutes int not null check (estimated_minutes between 3 and 10),
  translation text not null default 'NIV',
  is_placeholder boolean not null default true,
  created_at timestamptz not null default now(),
  constraint daily_bytes_niv_only check (translation = 'NIV')
);

create table if not exists public.user_daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_byte_id uuid not null references public.daily_bytes(id) on delete cascade,
  completed_at timestamptz,
  reflection_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, daily_byte_id)
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_completed_on date,
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_id uuid not null references public.bible_verses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, verse_id)
);

create table if not exists public.notification_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  reminder_time time not null,
  timezone text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (
    event_name in (
      'onboarding_started',
      'onboarding_completed',
      'lesson_started',
      'lesson_completed',
      'streak_updated',
      'notification_opened',
      'snippet_viewed'
    )
  ),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_bytes_date on public.daily_bytes(date);
create index if not exists idx_user_daily_progress_user on public.user_daily_progress(user_id);
create index if not exists idx_saved_verses_user on public.saved_verses(user_id);
create index if not exists idx_analytics_events_user_created on public.analytics_events(user_id, created_at desc);

alter table public.user_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_daily_progress enable row level security;
alter table public.streaks enable row level security;
alter table public.saved_verses enable row level security;
alter table public.notification_schedules enable row level security;
alter table public.analytics_events enable row level security;

create policy "user_profiles_owner_rw" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_preferences_owner_rw" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_daily_progress_owner_rw" on public.user_daily_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "streaks_owner_rw" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "saved_verses_owner_rw" on public.saved_verses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notification_schedules_owner_rw" on public.notification_schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "analytics_events_owner_rw" on public.analytics_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bible_books_read_all_auth" on public.bible_books
  for select to authenticated using (true);

create policy "bible_chapters_read_all_auth" on public.bible_chapters
  for select to authenticated using (true);

create policy "bible_verses_read_all_auth" on public.bible_verses
  for select to authenticated using (true);

create policy "daily_bytes_read_all_auth" on public.daily_bytes
  for select to authenticated using (true);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tr_user_profiles_updated_at
before update on public.user_profiles
for each row execute procedure public.touch_updated_at();

create trigger tr_user_preferences_updated_at
before update on public.user_preferences
for each row execute procedure public.touch_updated_at();

create trigger tr_user_daily_progress_updated_at
before update on public.user_daily_progress
for each row execute procedure public.touch_updated_at();

create trigger tr_notification_schedules_updated_at
before update on public.notification_schedules
for each row execute procedure public.touch_updated_at();

create or replace function public.handle_lesson_completion(p_user_id uuid, p_daily_byte_id uuid, p_completed_at timestamptz)
returns void
language plpgsql
security definer
as $$
declare
  completion_day date := timezone('utc', p_completed_at)::date;
  prev_day date;
  current_count int;
  longest_count int;
begin
  insert into public.user_daily_progress (user_id, daily_byte_id, completed_at)
  values (p_user_id, p_daily_byte_id, p_completed_at)
  on conflict (user_id, daily_byte_id)
  do update set completed_at = excluded.completed_at, updated_at = now();

  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_on)
  values (p_user_id, 1, 1, completion_day)
  on conflict do nothing;

  select last_completed_on, current_streak, longest_streak
  into prev_day, current_count, longest_count
  from public.streaks
  where user_id = p_user_id
  for update;

  if prev_day = completion_day then
    return;
  elsif prev_day = completion_day - interval '1 day' then
    current_count := current_count + 1;
  else
    current_count := 1;
  end if;

  longest_count := greatest(longest_count, current_count);

  update public.streaks
  set current_streak = current_count,
      longest_streak = longest_count,
      last_completed_on = completion_day,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke all on function public.handle_lesson_completion(uuid, uuid, timestamptz) from public;
grant execute on function public.handle_lesson_completion(uuid, uuid, timestamptz) to authenticated;
