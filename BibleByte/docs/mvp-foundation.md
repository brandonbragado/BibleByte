# BibleByte Phase 1 Foundation (Supabase Path)

This document is the implementation baseline for MVP delivery on iOS and Android.

## 1) Project Architecture

- Mobile client: Expo + React Native + TypeScript in `apps/mobile`
- Backend platform: Supabase Auth + Postgres + Storage + Edge Functions in `supabase`
- Shared contracts: Zod-based DTOs and events in `packages/contracts`
- State + data access:
  - Auth/session state in Zustand stores
  - Async server state with TanStack Query
  - Supabase client isolated in `apps/mobile/src/services/supabase`
- Content policy:
  - NIV-only product scope
  - Placeholder scripture text until licensing is approved
  - Explicit TODO markers for licensing and attribution

## 2) Folder Structure

The repo keeps the current monorepo layout and expands the mobile app with feature-safe modules.

```txt
apps/mobile/src/
  components/
  constants/
  features/
    learning/
    scripture-snippets/
    progress/
    onboarding/
    auth/
    bible-reader/
    dashboard/
  hooks/
  navigation/
  services/
    supabase/
  state/
  stores/
  theme/
  types/
  utils/

supabase/
  migrations/
  seed/
  edge-functions/
```

## 3) Database Schema (Source of Truth)

Schema is defined in `supabase/migrations/20260426_000001_phase1_mvp.sql`.

Primary entities:
- `user_profiles`
- `user_preferences`
- `bible_books`
- `bible_chapters`
- `bible_verses` (placeholder/public-domain safe content only for MVP)
- `daily_bytes`
- `user_daily_progress`
- `streaks`
- `saved_verses`
- `notification_schedules`
- `analytics_events`

Security:
- Row Level Security enabled on all user-scoped tables
- Policies restrict reads/writes to authenticated owner (`auth.uid()`)
- Server-side function (`handle_lesson_completion`) updates streak data atomically

## 4) API Contract

Mobile contract definitions are in `packages/contracts/src/index.ts`.

MVP endpoints/contracts:
- onboarding preference upsert
- daily byte fetch
- progress complete mutation
- streak summary read
- snippet payload read
- notification schedule upsert

Edge functions are organized in `supabase/edge-functions` as deploy targets:
- `daily-byte`
- `lesson-complete`
- `notification-dispatch` (APNs/FCM ready placeholder)

## 5) Implementation Checklist (Phase 1 Only)

- [x] Define architecture, schema, and contracts before implementation
- [x] Add Supabase folder and migration baseline with RLS
- [x] Isolate mobile Supabase client
- [x] Add centralized auth/session store
- [ ] Implement auth UI: email/password + Apple + Google
- [ ] Wire onboarding screens to Supabase persistence
- [ ] Build Dashboard + Today flow from live data
- [ ] Add progress completion + streak updates
- [ ] Add Bible Reader (book/chapter/verse + search + favorites)
- [ ] Add reminder scheduling and notification deep links
- [ ] Add account deletion flow and analytics opt-in controls

## 6) Licensing and Compliance Notes

- TODO[NIV_LICENSE]: Replace placeholders with licensed NIV text only after legal approval.
- TODO[NIV_ATTRIBUTION]: Add Biblica-required attribution and usage constraints before release.
- Translation switching is intentionally out of scope for MVP.
