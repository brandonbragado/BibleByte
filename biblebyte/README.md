# BibleByte

Premium, minimalist spiritual growth platform—**web-first** (Next.js), backed by **Supabase**, with a path to React Native later.

## Stack

- Next.js App Router · TypeScript · Tailwind CSS v4
- shadcn-style UI (Button, Card, Input, …) · Framer Motion
- Supabase (Auth, Postgres, RLS)
- OpenAI API (optional; companion returns safe placeholder when `OPENAI_API_KEY` is unset)
- Deploy: Vercel

## Local setup

```bash
cd biblebyte
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Add SUPABASE_SERVICE_ROLE_KEY (server-only) before using Settings → Delete account
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API.Bible (Next.js only)

Scripture from **API.Bible** is loaded **only on the Next.js server**: `API_BIBLE_KEY` and bible ids live in **`.env.local` / Vercel env**, and the browser calls **`/api/scripture/*`** routes. **Supabase does not proxy API.Bible** and does not store the API key. Supabase still holds app data (e.g. `daily_verses` **reference** text for the home card—not API.Bible credentials).

## Supabase configuration

1. Create a Supabase project and run migrations in order (SQL editor or CLI):
   - `supabase/migrations/001_biblebyte_core.sql`
   - `supabase/migrations/002_daily_reflections_entry_date.sql` (adds `entry_date` + unique daily reflection per user)
   - `supabase/migrations/003_tier1_reading_and_companion.sql` (`reading_positions`, `chat_sessions.updated_at`)
   - `supabase/migrations/004_tier2_journal_daily_verse.sql` (`prayers`, `journal_entries`, `daily_verses` + seed)
   - `supabase/migrations/005_tier3_personalization.sql` (preferences columns, `analytics_events`, `push_devices`, `daily_verses` read scope)
   - `supabase/migrations/006_scripture_license_markers.sql` (COMMENT markers on `daily_verses` — TODO[NIV_LICENSE])
   - `supabase/migrations/007_profile_identity.sql` (`first_name`, `last_name`, `phone` on `user_profiles`)
2. **Authentication → Providers**:
   - **Google**: enable and paste client id + secret; authorize redirect URLs (below).
   - **Apple (optional — hidden in the sign-in UI for now; enable in Supabase when you add the button back)**:
     1. In [Apple Developer](https://developer.apple.com/account/resources/identifiers/list/serviceId), create a **Services ID** (e.g. `com.yourorg.biblebyte.web`) and turn on **Sign In with Apple**.
     2. Under **Web Authentication Configuration**, add your **Domains** (production hostname; Apple requires HTTPS except for limited local testing) and **Return URLs**. You **must** include Supabase’s callback exactly: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback` (same URL shown in **Authentication → Providers → Apple** in Supabase).
     3. Create a **Sign in with Apple** **Key** (.p8), note **Key ID** and **Team ID**, then generate the **Secret Key** (JWT) Supabase expects—[Supabase Apple guide](https://supabase.com/docs/guides/auth/social-login/auth-apple) documents the dashboard fields. **Rotate that secret about every 6 months** or Apple sign-in will start failing.
     4. In Supabase → **Apple** provider: paste **Services ID** (client id), secret, and enable the provider.
3. **Authentication → URL configuration** — **Redirect URLs** allowlist (examples):
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`
   Wildcards like `http://localhost:3000/auth/callback**` are supported per Supabase redirect rules—match what you use after OAuth.
4. Set **Site URL** to your primary origin (e.g. production `https://…` or local `http://localhost:3000` for dev).

## Routes (Phase 1)

| Path | Purpose |
|------|---------|
| `/` | Landing (guest) |
| `/login` | Google OAuth |
| `/auth/callback` | OAuth code exchange |
| `/onboarding` | 5-step spiritual profile |
| `/home` | Primary experience; optional **live daily verse** via `HOME_DAILY_VERSE_USE_SCRIPTURE_API` + `api_bible` |
| `/bible`, `/journal`, `/profile`, `/settings` | Bible reader + Tier 3 personalization surfaces |
| `POST /api/ai/chat` | BibleByte AI companion (auth required; OpenAI server-side; session + history in Supabase — apply migration `008_chat_messages_text_user.sql`) |
| `POST /api/analytics` | Opt-in analytics events (`analytics_opt_in` must be true) |
| `GET /api/snippet/today` | Public JSON snippet for widgets / Expo — withholds body until `SCRIPTURE_ALLOW_LICENSED_TEXT_WIDGETS` |
| `GET /api/scripture/chapters?book=GEN&chapter=1` | Chapter JSON — `api_bible` uses API.Bible; optional **`API_BIBLE_PLACEHOLDER_ON_UPSTREAM_ERROR`** returns mock text if auth/upstream fails |
| `GET /api/scripture/bibles` | Bible catalog — **only when `SCRIPTURE_PROVIDER_MODE=api_bible`** (else HTTP 503 `scripture_mode_required`) |
| `GET /api/scripture/books?bibleId=` | Books for a Bible id — **same mode gate**; optional `bibleId` defaults to active edition |
| `GET /api/scripture/passages?passageId=` | Passage reader JSON — optional `bibleId`; defaults to active edition |
| `GET /api/scripture/passage?bibleId=&passageId=` | Same payload — explicit Bible + passage (mobile/BFF friendly) |
| `GET /api/scripture/search?query=` | Search — optional `bibleId`, `limit` (1–50); **same mode gate** |
| `/bible/passage?passageId=` | In-app passage reader (e.g. deep link from search); uses `/api/scripture/passages` |
| `POST /api/push/register` | Upserts Expo/APNs/FCM device token (`push_devices`; migration 005) |
| `GET /api/cron/reminders` | `Authorization: Bearer $CRON_SECRET` — resolves UTC-minute reminders (`dispatched` stays `0` until `TODO[APNs_FCM]`) |

## Product & trust

- Companion system prompt enforces humility, no divine claims, no replacement for pastors or licensed counseling, and denomination-neutral tone.
- Scripture text in the UI uses **placeholder copy** until publisher licensing is wired—do not paste full copyrighted translations without clearance.
- Translation and widget features are scaffolded in product docs; mobile (Expo) is **Phase 5**.

## Security notes

- **`.env.local`** is gitignored (see `.gitignore`) — never commit real `API_BIBLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or OAuth/API tokens. Rotate anything that was pasted into chat or screenshots.
- **Snippet errors** return `X-Request-Id` for correlation without logging verse bodies at info level.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run verify:migrations` | Fails CI if expected SQL migrations are missing / mis-ordered |
| `npm run verify:schema` | Probes **live** Supabase (`NEXT_PUBLIC_*` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`) for tables/columns |
| `npm run verify:api-bible` | Curl API.Bible `/v1/bibles` using `API_BIBLE_KEY` from env or `.env.local` — exit 0 only on HTTP 200 |
| `npm run verify:all` | Runs filesystem migrations check **then** remote schema probe |
| `npm run test:unit` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm test` | `verify:migrations` + `test:unit` |

### Critical readiness checklist (items 1–7)

1. **Migrations applied & verified** — Apply `001`–`008` in Supabase for the same project your env points at; run `npm run verify:migrations` (files) **and** `npm run verify:schema` (remote schema). CI runs filesystem verification only — schema probe needs secrets.
2. **Licensed scripture** — Keep placeholders until publisher/API clears rights ([`docs/LICENSING_SCRIPTURE.md`](docs/LICENSING_SCRIPTURE.md), `src/config/scripture.ts`, `TODO[NIV_LICENSE]` in migrations).
3. **Push & reminders** — Hooks: [`docs/PUSH_REMINDERS.md`](docs/PUSH_REMINDERS.md). Set `CRON_SECRET`; deploy includes [`vercel.json`](vercel.json) cron hitting `/api/cron/reminders`. Cron counts eligible users/devices; **`dispatched`** stays `0` until FCM/APNs + Expo (`TODO[APNs_FCM]`).
4. **Account deletion** — Settings → Delete account requires `SUPABASE_SERVICE_ROLE_KEY` server-side only (never expose to clients).
5. **Security / scaling** — In-memory rate limits (`src/lib/rate-limit/memory.ts`) suit single-instance previews; use Redis/Upstash when horizontally scaled; rotate `CRON_SECRET` and service role keys per env.
6. **Mobile Phase 5** — See [`docs/MOBILE_PHASE5.md`](docs/MOBILE_PHASE5.md) for Expo/deep-link checklist (not implemented in this package).
7. **CI** — `.github/workflows/ci.yml` (repo root) runs `lint`, `build`, `verify:migrations`, and `test:unit` under `biblebyte/`.

---

Build order: foundation & auth → home + AI UI → Bible & journal persistence → personalization (Tier 3: reminders/analytics/snippet hooks) → mobile (Expo).
