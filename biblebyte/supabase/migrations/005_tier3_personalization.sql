-- Tier 3: personalization — preferences, analytics (opt-in), push placeholder, snippet-friendly reads.

-- ---------------------------------------------------------------------------
-- Profile preferences
-- ---------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists analytics_opt_in boolean not null default false;

alter table public.user_profiles
  add column if not exists reminder_enabled boolean not null default false;

-- User's intended reminder wall time; timezone picker ships with mobile — store as naive clock.
alter table public.user_profiles
  add column if not exists reminder_wall_time time without time zone;

comment on column public.user_profiles.analytics_opt_in is 'When true, client and server may insert into analytics_events.';
comment on column public.user_profiles.reminder_wall_time is 'Local reminder time placeholder; pair with TZ in a later release.';

-- ---------------------------------------------------------------------------
-- Product analytics (opt-in only; insert from app with user JWT)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_created_idx
  on public.analytics_events (user_id, created_at desc);

alter table public.analytics_events enable row level security;

create policy "Users insert own analytics events"
  on public.analytics_events
  for insert
  with check (auth.uid() = user_id);

create policy "Users read own analytics events"
  on public.analytics_events
  for select
  using (auth.uid() = user_id);

comment on table public.analytics_events is 'Privacy-respecting event log; respect analytics_opt_in in app logic before insert.';

-- ---------------------------------------------------------------------------
-- Push device registration (TODO: wire APNs / FCM from Expo native build)
-- ---------------------------------------------------------------------------
create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.push_devices enable row level security;

create policy "Users manage own push devices"
  on public.push_devices
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists push_devices_user_idx on public.push_devices (user_id);

comment on table public.push_devices is 'TODO[APNs_FCM]: Register device tokens from Expo; server-side sends for reminder fallback.';

-- ---------------------------------------------------------------------------
-- Saved verses: prevent duplicate bookmarks per reference
-- ---------------------------------------------------------------------------
create unique index if not exists saved_verses_user_reference_unique
  on public.saved_verses (user_id, reference);

-- ---------------------------------------------------------------------------
-- Daily verses: allow unauthenticated reads for widget/snippet JSON (placeholder text only).
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users read daily verses" on public.daily_verses;

create policy "Daily verse placeholders readable"
  on public.daily_verses
  for select
  using (true);

grant select on public.daily_verses to anon, authenticated;
