# BibleByte - Phase 1 MVP

A minimalist, calm, premium Bible learning app. Short, NIV-only daily sessions
with reflection, prayer, save & share, streak tracking, and gentle reminders.

> All scripture in this MVP is rendered as `is_placeholder = true`
> NIV-safe text. Real NIV scripture will be wired in only after licensing is
> finalized. Search the codebase for `TODO[NIV_LICENSE]` to find every place
> that needs review before launch.

## Stack

- **Mobile**: Expo + React Native + TypeScript, React Navigation, Zustand,
  TanStack Query, NativeWind, MMKV, expo-notifications.
- **Design system**: Shared theme tokens in `packages/ui` plus reusable
  primitives (`Button`, `Card`, `VerseCard`, `Screen`, `Input`, `ListRow`) in
  `apps/mobile/src/components/ui/`.
- **Backend**: Supabase (Postgres + Auth + RLS + Edge Functions). NestJS BFF
  scaffold in `apps/api` for future server-side aggregation.
- **Shared contracts**: Zod schemas in `packages/contracts`.

## Workspace

- `apps/mobile` - Expo app (target Phase 1 surface).
- `apps/api` - NestJS backend scaffold (future BFF endpoints).
- `apps/web` - placeholder for marketing/admin (future).
- `supabase/migrations` - Postgres schema + RLS + RPCs.
- `supabase/seed` - placeholder NIV-safe seed content.
- `packages/contracts` - shared Zod schemas.
- `packages/ui` - shared design tokens.
- `packages/config` - shared tsconfig.

## Feature map (Phase 1 MVP)

| Surface | Folder | Notes |
| --- | --- | --- |
| Onboarding (goal -> faith focus -> reminder) | `apps/mobile/src/features/onboarding` | Writes `user_profiles`, `user_preferences`, `notification_schedules`. |
| Auth (welcome / sign-in / sign-up) | `apps/mobile/src/features/auth` | Supabase Auth (email + Google/Apple OAuth). Anonymous start supported. |
| Today (spotlight verse + daily BibleByte + reflection + Bible Chat) | `apps/mobile/src/features/today` | Top: deterministic “scripture spotlight” from the `bible_verses` pool. Middle: `daily_bytes` lesson + completion RPC. Bottom: Bible Chat UI → `POST /v1/bible-chat` on the Nest API (OpenAI key **server-side only**). |
| Bible reader (book / chapter / verse / search / highlights) | `apps/mobile/src/features/bible-reader` | Full 66-book canon with OT/NT grouping, "continue reading", verse action sheet (save / highlight / share / copy), 4-color highlights, reference-jump search (`John 3:16`). Placeholder verse content only until licensing. |
| Growth (streak + completed lessons) | `apps/mobile/src/features/progress` | Reads `streaks`, counts `user_daily_progress`. |
| Saved | `apps/mobile/src/features/bookmarks` | Two sections: highlighted verses (DB-backed) plus saved verses merged from Supabase `saved_verses` and MMKV-cached daily verses. |
| Profile / Settings | `apps/mobile/src/features/settings` | Reminder time, analytics opt-in, sign out, account deletion. |
| Snippet (preview) | `apps/mobile/src/features/scripture-snippets` | Phase 2 surface for WidgetKit / Android App Widget. |

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure env:
   - Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set
     `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon only -
     never the service role key).
   - Copy `apps/api/.env.example` to `apps/api/.env` for the API workspace.
     For **Bible Chat**, add `OPENAI_API_KEY` (never ship this to mobile). When
     testing locally, set `EXPO_PUBLIC_API_URL=http://localhost:3000` in
     `apps/mobile/.env` so the Today tab can reach `POST /v1/bible-chat`.
3. Apply Supabase SQL in your project (run in this order):
   1. `supabase/migrations/20260426_000001_phase1_mvp.sql`
   2. `supabase/migrations/20260427_000002_anon_access.sql`
   3. `supabase/migrations/20260427_000003_bible_tab_v2.sql`
   4. `supabase/seed/phase1_seed.sql`
4. Run the mobile app:
   ```bash
   npm run dev:mobile           # native dev (Metro on port 8086)
   npm run dev:mobile:clear     # native dev with cleared Metro cache
   npm run dev:mobile:web       # browser preview via React Native Web (port 8087)
   npm run dev:mobile:web:clear # browser preview with cleared bundler cache
   ```
   The web target boots the same Expo project through `react-native-web`, so
   every screen, component, and Supabase call you write for iOS/Android is
   shared. Native-only modules are platform-shimmed:

   | Module | Native | Web |
   | --- | --- | --- |
   | KV cache (analytics opt-in, saved-daily, snippet cache) | `react-native-mmkv` | `window.localStorage` (`apps/mobile/src/services/storage/kvStorage.web.ts`) |
   | Auth token storage | `expo-secure-store` (Keychain / Keystore) | `window.localStorage` (`apps/mobile/src/services/supabase/secureStorage.web.ts`) |
   | Local notifications | `expo-notifications` | No-op + DB upsert (`apps/mobile/src/services/notificationService.web.ts`) |

   The web build is intended for development previews. Before any public
   web release, swap `secureStorage.web.ts` for cookie-backed Supabase SSR
   sessions and wire Web Push (see `TODO[WEB_AUTH_HARDENING]` and
   `TODO[WEB_NOTIFICATIONS_PHASE2]`).
5. (Optional) verify the auth env-var layout: `npm run verify:auth-env`.

### Enable Bible Chat (Today tab)

The chat UI calls **`POST /v1/bible-chat`** on the Nest API with the user’s Supabase JWT. The API reads **`OPENAI_API_KEY`** from **`apps/api/.env`** (never put this key in the mobile app).

1. **OpenAI key** — Create an API key at [OpenAI API keys](https://platform.openai.com/api-keys).
2. **API `.env`** — Copy `apps/api/.env.example` → `apps/api/.env` if needed. Set:
   - `OPENAI_API_KEY=sk-...`
   - The **same Supabase** settings as your mobile app (`SUPABASE_URL`, `SUPABASE_JWKS_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`) so tokens from the app validate. The API loads `.env` automatically on startup (see `apps/api/src/main.ts`).
3. **Start the API** (from repo root):
   ```bash
   npm run dev:api
   ```
   You should see the server on **port 3000** by default (`PORT` in `.env`).
4. **Mobile `.env`** — In `apps/mobile/.env`, set **no trailing slash**:
   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```
   - **iOS Simulator** and **web** (`npm run dev:mobile:web`) can use `localhost`.
   - **Android emulator** often needs `http://10.0.2.2:3000` instead of `localhost`.
   - **Physical phone** on the same Wi‑Fi: use your computer’s LAN address, e.g. `http://192.168.1.42:3000` (your machine’s IP from System Settings / `ipconfig`).
5. **Restart Metro** after changing `EXPO_PUBLIC_API_URL` (`--clear` if the app still shows “configure API”).

Sign in once in the app; chat sends `Authorization: Bearer <access_token>` to the API.

## Quality gates

- **Typecheck**: `npm run typecheck` (workspaces: mobile / api / web /
  contracts / ui).
- **Tests**: `npm run test` (API smoke test today; expand with feature tests
  as Phase 1 stabilizes).
- **Lint**: `npm run lint` (placeholder; ESLint integration is a follow-up
  task).

## Architecture

```mermaid
flowchart TD
  Mobile[Mobile (Expo)] --> Auth[Supabase Auth]
  Mobile --> ApiClient[apiClient.ts]
  Mobile --> ProgressSvc[progressService.ts]
  Mobile --> SavedSvc[savedItemsService.ts]
  Mobile --> NotifSvc[notificationService.ts]
  Mobile --> AnalyticsSvc[analyticsService.ts]
  Mobile --> MMKV[(MMKV cache)]
  ApiClient --> Postgres[Supabase Postgres]
  ProgressSvc --> Postgres
  SavedSvc --> Postgres
  NotifSvc --> Expo[expo-notifications]
  AnalyticsSvc --> Postgres
```

### Layered code structure

- **Presentation**: feature folders own screens and feature-specific UI.
- **Shared UI**: `apps/mobile/src/components/ui/*` design primitives consume
  tokens from `@biblebites/ui`.
- **Services**: `apps/mobile/src/services/*` are the only modules that touch
  Supabase / Expo APIs. They validate writes with `@biblebites/contracts` Zod
  schemas (`OnboardingPreferenceSchema`, `NotificationScheduleSchema`,
  `SavedVerseSchema`, `AnalyticsEventSchema`, `TodayLessonSchema`,
  `ProgressCompleteSchema`).
- **State**: Zustand stores in `apps/mobile/src/state` and `stores/` for
  session and user-flow state. TanStack Query owns server state.
- **Hooks**: `apps/mobile/src/hooks/*` hide service plumbing from screens.

### Bible tab v2 — what's in / what's gated

What ships now (placeholder-safe):

- Old / New Testament accordions with canonical book groupings (Pentateuch,
  Historical, Wisdom, Major Prophets, Minor Prophets, Gospels, Acts, Pauline
  Letters, General Letters, Apocalyptic). All 66 books are seeded.
- "Continue reading" card on the Bible tab driven by `reading_positions`.
- Verse action sheet (Save · Highlight · Share · Copy) replacing always-on
  buttons. Tap any verse row to open it.
- Per-verse highlights in 4 calm tones (`sage`, `amber`, `blush`, `sky`),
  stored in `verse_highlights`, optimistically rendered, and surfaced in a
  dedicated "Highlights" section above Saved verses.
- Reference-jump search: type `John 3:16`, `Ps 23`, `1 Cor 13` etc. and the
  search screen shows a tap-to-open card. Falls back to keyword search.
- Reading position is upserted to the chapter's first verse (or jumped-to
  verse) on every chapter open; resuming triggers `reading_resumed`.

What stays gated on NIV licensing:

- All `bible_verses.verse_text` remains `is_placeholder = true` placeholder
  copy. The CHECK constraint `bible_verses_niv_only` rejects any non-NIV
  translation. Search the repo for `TODO[NIV_LICENSE]` for the full list.
- Audio narration, cross-references, and footnotes are intentionally not
  built yet — they require NIV licensing to ship.

New tables introduced by `20260427_000003_bible_tab_v2.sql`:

| Table | Purpose | RLS |
| --- | --- | --- |
| `reading_positions` | One row per user; tracks last read book / chapter / verse. | `auth.uid() = user_id` |
| `verse_highlights` | One row per (user, verse) with a color in `sage|amber|blush|sky`. | `auth.uid() = user_id` |

`bible_books` gets a new `book_group` column (`pentateuch`, `gospels`, ...)
plus an index on `(testament, book_group, order_index)`.

### Security & privacy

- All user-scoped tables (`user_profiles`, `user_preferences`,
  `user_daily_progress`, `streaks`, `saved_verses`, `notification_schedules`,
  `reading_positions`, `verse_highlights`) enforce `auth.uid() = user_id`
  RLS.
- `analytics_events` allows authenticated owner CRUD plus null-`user_id`
  inserts (anonymous events) - see `analytics_events_insert_anon` policy.
- `bible_books`, `bible_chapters`, `bible_verses`, and `daily_bytes` are
  publicly readable so anonymous users can use the app before signing up.
- Mobile env validation lives in `apps/mobile/src/constants/env.ts` and
  refuses to start if a service-role key sneaks into the bundle.
- Account deletion: `request_account_deletion(uuid)` RPC purges every
  user-owned row, including the new `reading_positions` and
  `verse_highlights` tables. The auth row itself must be removed by a
  privileged Edge Function (see `TODO[ACCOUNT_DELETE_AUTH]`).

### Analytics events

`analytics_events.event_name` accepts the union below. Mobile writes go
through `apps/mobile/src/services/analyticsService.ts`, which validates the
name against `AnalyticsEventSchema` from `@biblebites/contracts`.

| Event | Surface |
| --- | --- |
| `onboarding_started`, `onboarding_completed` | `features/onboarding` |
| `lesson_started`, `lesson_completed`, `streak_updated` | `features/today`, `features/progress` |
| `notification_opened`, `reminder_scheduled`, `reminder_disabled` | `services/notificationService.ts` |
| `snippet_viewed` | `features/scripture-snippets` |
| `verse_saved`, `verse_unsaved`, `verse_shared` | `features/today`, `features/bible-reader`, `features/bookmarks` |
| `verse_highlighted`, `verse_unhighlighted` | `features/bible-reader` (action sheet), `features/bookmarks` |
| `reference_jumped` | `features/bible-reader/SearchScreen.tsx` |
| `reading_resumed` | `features/bible-reader/BibleBooksScreen.tsx` continue-reading card |

### NIV / licensing

- All `bible_verses` and `daily_bytes` rows ship with `is_placeholder = true`
  and `translation = 'NIV'`. The DB has check constraints that refuse any
  other translation.
- Search the codebase for `TODO[NIV_LICENSE]` to find every text surface that
  needs review (seed data, share footer, snippet preview, daily verse
  fallback).

### Notifications

- Expo local notifications are scheduled via
  `apps/mobile/src/services/notificationService.ts` and validated with
  `NotificationScheduleSchema`.
- Deep links use the `biblebyte://` scheme (with legacy `biblebites://`
  preserved for older builds). Notification taps emit `notification_opened`
  analytics events and route to the Today tab.
- See `TODO[APNS_FCM_PHASE2]` for the remote-push fallback plan.

## MVP validation checklist

Run these before tagging a Phase 1 build:

- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes.
- [ ] Apply both migrations + seed against a fresh Supabase project; verify
      RLS by attempting cross-user reads with the anon key.
- [ ] Sign up a new account end-to-end: onboarding writes, daily verse loads,
      complete lesson updates `streaks.current_streak` to 1.
- [ ] Save a verse from Today + Reader + Search; confirm Saved screen merges
      both DB rows and MMKV-cached daily verses.
- [ ] Schedule a reminder; verify a `notification_schedules` row is upserted
      and a daily local notification is queued.
- [ ] Toggle analytics opt-in OFF; confirm no rows are written to
      `analytics_events` while signed in.
- [ ] Trigger account deletion; confirm all user-owned rows are removed and
      the user is signed out.
- [ ] Open a notification while the app is backgrounded; confirm the deep
      link routes to the Today tab.

## Roadmap (post Phase 1)

- WidgetKit (iOS) and Android App Widget for daily snippet.
- Real NIV licensing + attribution rollout.
- APNs/FCM remote push fallback driven by `notification_schedules`.
- Subscriptions and AI Bible study companion.
