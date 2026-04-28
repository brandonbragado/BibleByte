-- BibleByte Phase 1 follow-up: relax read access for Bible content to anon,
-- allow anonymous analytics writes (with null user_id), expand the
-- analytics_events event_name allow-list, and add an account-deletion RPC.

-- Expand the allow-list on analytics_events to match the shared Zod enum
-- (`AnalyticsEventSchema` in @biblebites/contracts).
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
      'reminder_disabled'
    )
  );

-- Bible content is non-sensitive placeholder data; allow anon read.
drop policy if exists "bible_books_read_all_auth" on public.bible_books;
drop policy if exists "bible_chapters_read_all_auth" on public.bible_chapters;
drop policy if exists "bible_verses_read_all_auth" on public.bible_verses;
drop policy if exists "daily_bytes_read_all_auth" on public.daily_bytes;

create policy "bible_books_read_all" on public.bible_books
  for select to anon, authenticated using (true);

create policy "bible_chapters_read_all" on public.bible_chapters
  for select to anon, authenticated using (true);

create policy "bible_verses_read_all" on public.bible_verses
  for select to anon, authenticated using (true);

create policy "daily_bytes_read_all" on public.daily_bytes
  for select to anon, authenticated using (true);

-- Analytics: keep owner-scoped read/update/delete, but allow inserts where
-- user_id matches auth.uid() OR is explicitly null (anonymous events).
drop policy if exists "analytics_events_owner_rw" on public.analytics_events;

create policy "analytics_events_owner_select"
  on public.analytics_events
  for select to authenticated
  using (auth.uid() = user_id);

create policy "analytics_events_owner_modify"
  on public.analytics_events
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "analytics_events_owner_delete"
  on public.analytics_events
  for delete to authenticated
  using (auth.uid() = user_id);

create policy "analytics_events_insert_authenticated"
  on public.analytics_events
  for insert to authenticated
  with check (user_id is null or auth.uid() = user_id);

create policy "analytics_events_insert_anon"
  on public.analytics_events
  for insert to anon
  with check (user_id is null);

-- Account deletion --------------------------------------------------------
-- RPC purges all user-owned rows in public schema. The Supabase auth user
-- row itself must be removed by a privileged Edge Function (TODO below).
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

-- TODO[ACCOUNT_DELETE_AUTH]: Add an Edge Function that, after this RPC runs,
-- uses the service role key to delete the auth.users row for the requesting
-- user. The function must verify the JWT belongs to the same user_id.
