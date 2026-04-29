# Push reminders — wiring checklist (`TODO[APNs_FCM]`)

Hooks already in the Next app:

| Piece | Purpose |
|-------|---------|
| `POST /api/push/register` | Stores `{ platform, device_token }` per user (`push_devices`). |
| `GET /api/cron/reminders` | Cron-auth’d sweep — counts who should get a reminder **this UTC minute** + matching devices (`dispatched` stays `0` until FCM/APNs). |

## 1. Environment (Vercel + local)

| Variable | Notes |
|----------|--------|
| `CRON_SECRET` | Random string (`openssl rand -hex 32`). In Vercel, Cron sends `Authorization: Bearer $CRON_SECRET`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron route uses admin client to read across users (never expose client-side). |

## 2. Scheduler

`vercel.json` registers a daily Hobby-plan-safe cron hitting `/api/cron/reminders`.
Adjust cadence when the project moves to a scheduler that supports higher frequency:

- Reminders compare **UTC minute** to `reminder_wall_time` — run **at least once per minute** if you want minute precision with naive UTC storage.
- Lower-frequency crons can skip users unless their reminder falls exactly when the cron fires.

External schedulers (GitHub Actions, Cloud Scheduler) may call the same URL with `Authorization: Bearer …`.

## 3. Expo / native client

1. Add **`expo-notifications`** + platform credentials via **EAS** (FCM for Android, APNs for iOS).
2. On token refresh, **`POST /api/push/register`** with session cookies or Supabase JWT (same-origin web session cookie flow applies to Expo WebView only—in native use Bearer token pattern if you add it later).
3. Store **IANA time zone** per user when you graduate beyond UTC wall-clock reminders (`reminder_wall_time` today is naive UTC).

## 4. Dispatch implementation (next coding phase)

- Respect **`SCRIPTURE_ALLOW_LICENSED_TEXT_PUSH`** — notification bodies must stay non-NIV until this flag is enabled alongside legal approval (`src/config/scripture.ts`).

- Add **`firebase-admin`** (FCM) and/or **`@parse/node-apn`** / Expo push abstraction.
- Inside cron loop over matched devices: enqueue sends with backoff + structured logs.
- Never log raw device tokens in production info-level logs.

See also [`MOBILE_PHASE5.md`](MOBILE_PHASE5.md).
