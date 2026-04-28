# Phase 5 — Expo / native shell (critical action item #6)

This repo ships **web-first**. Use this checklist when you scaffold `apps/mobile` (Expo + EAS).

Reminder hooks (`POST /api/push/register`, cron sweep) are documented in [`PUSH_REMINDERS.md`](PUSH_REMINDERS.md).

## Deep links (proposed scheme)

| Intent | URI |
|--------|-----|
| Home | `biblebyte://home` |
| Today’s snippet | `biblebyte://verse/today` |
| Reader passage | `biblebyte://bible/{bookCode}/{chapter}` |

Wire universal links later via:

- iOS: Apple Team ID + Associated Domains (`apple-app-site-association` on your web domain).
- Android: Digital Asset Links JSON on the same domain.

Point those JSON files at the deployed Vercel domain once routes are stable.

## API surfaces the app should call

| Endpoint | Notes |
|----------|--------|
| `GET https://<domain>/api/snippet/today` | Cached JSON; no auth (placeholder copy only). |
| `POST https://<domain>/api/push/register` | `{ "platform": "ios" \| "android" \| "web", "device_token": "..." }` with user session cookie or Supabase JWT. |
| Supabase Auth | Same project as web—reuse `NEXT_PUBLIC_SUPABASE_*` in Expo `app.config` / EAS secrets. |

## Widgets (Phase 5+)

- **WidgetKit (iOS)** and **Android App Widgets** should read `GET /api/snippet/today` on a timer; keep payloads **placeholder-safe** until `TODO[NIV_LICENSE]` clears.
- TODO[WidgetKit_Android]: Pair with push registration for stale data refresh.

## Native work not in this repo

- `expo-notifications` + APNs/FCM credentials in EAS.
- Background tasks for reminder alignment with `reminder_wall_time` + user time zone.
- OAuth redirect URLs duplicated for Expo dev client vs production builds.
