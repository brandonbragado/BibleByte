-- BibleByte Bible-tab v2 schema
--
-- Adds book grouping metadata (Pentateuch / Wisdom / Gospels / ...), a
-- per-user "continue reading" position, per-user verse highlights, and four
-- new analytics events used by the redesigned Bible tab.
--
-- TODO[NIV_LICENSE]: Bible-text columns remain placeholder-safe; no licensed
-- NIV body text is introduced by this migration.

-- 1. bible_books.book_group ------------------------------------------------
alter table public.bible_books
  add column if not exists book_group text;

alter table public.bible_books
  drop constraint if exists bible_books_book_group_check;

alter table public.bible_books
  add constraint bible_books_book_group_check
  check (
    book_group in (
      'pentateuch',
      'historical',
      'wisdom',
      'major_prophets',
      'minor_prophets',
      'gospels',
      'acts_history',
      'pauline_letters',
      'general_letters',
      'apocalyptic'
    )
  );

create index if not exists idx_bible_books_testament_group
  on public.bible_books(testament, book_group, order_index);

-- 2. reading_positions -----------------------------------------------------
create table if not exists public.reading_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  book_id uuid not null references public.bible_books(id) on delete cascade,
  chapter_id uuid not null references public.bible_chapters(id) on delete cascade,
  verse_id uuid references public.bible_verses(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_reading_positions_user
  on public.reading_positions(user_id);

alter table public.reading_positions enable row level security;

create policy "reading_positions_owner_rw" on public.reading_positions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger tr_reading_positions_updated_at
before update on public.reading_positions
for each row execute procedure public.touch_updated_at();

-- 3. verse_highlights ------------------------------------------------------
create table if not exists public.verse_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_id uuid not null references public.bible_verses(id) on delete cascade,
  color text not null check (color in ('sage', 'amber', 'blush', 'sky')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, verse_id)
);

create index if not exists idx_verse_highlights_user
  on public.verse_highlights(user_id, updated_at desc);

alter table public.verse_highlights enable row level security;

create policy "verse_highlights_owner_rw" on public.verse_highlights
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger tr_verse_highlights_updated_at
before update on public.verse_highlights
for each row execute procedure public.touch_updated_at();

-- 4. Account-deletion RPC: also purge the new tables ----------------------
create or replace function public.request_account_deletion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.analytics_events where user_id = p_user_id;
  delete from public.verse_highlights where user_id = p_user_id;
  delete from public.reading_positions where user_id = p_user_id;
  delete from public.saved_verses where user_id = p_user_id;
  delete from public.notification_schedules where user_id = p_user_id;
  delete from public.user_daily_progress where user_id = p_user_id;
  delete from public.streaks where user_id = p_user_id;
  delete from public.user_preferences where user_id = p_user_id;
  delete from public.user_profiles where user_id = p_user_id;
end;
$$;

revoke all on function public.request_account_deletion(uuid) from public;
grant execute on function public.request_account_deletion(uuid) to authenticated;

-- 5. Expand analytics_events allow-list -----------------------------------
alter table public.analytics_events
  drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
  add constraint analytics_events_event_name_check
  check (
    event_name in (
      'onboarding_started',
      'onboarding_completed',
      'lesson_started',
      'lesson_completed',
      'streak_updated',
      'notification_opened',
      'snippet_viewed',
      'verse_saved',
      'verse_unsaved',
      'verse_shared',
      'reminder_scheduled',
      'reminder_disabled',
      'verse_highlighted',
      'verse_unhighlighted',
      'reference_jumped',
      'reading_resumed'
    )
  );
