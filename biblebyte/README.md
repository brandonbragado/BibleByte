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
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase configuration

1. Create a Supabase project and run `supabase/migrations/001_biblebyte_core.sql` (SQL editor or CLI).
2. **Authentication → Providers**: enable Google and Apple; add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`
3. **Authentication → URL configuration**: set site URL and additional redirect URLs to match `.env.local` / production.
4. Apple / Google OAuth client configurations must list Supabase’s callback URL exactly as documented in Supabase Auth settings.

## Routes (Phase 1)

| Path | Purpose |
|------|---------|
| `/` | Landing (guest) |
| `/login` | Google / Apple OAuth |
| `/auth/callback` | OAuth code exchange |
| `/onboarding` | 5-step spiritual profile |
| `/home` | Primary experience (hero, verse placeholder, reflection, AI companion, growth path) |
| `/bible`, `/journal`, `/profile`, `/settings` | Navigation shell + Phase 3/4 stubs |
| `POST /api/chat` | Companion (theology-safe JSON; OpenAI optional) |

## Product & trust

- Companion system prompt enforces humility, no divine claims, no replacement for pastors or licensed counseling, and denomination-neutral tone.
- Scripture text in the UI uses **placeholder copy** until publisher licensing is wired—do not paste full copyrighted translations without clearance.
- Translation and widget features are scaffolded in product docs; mobile (Expo) is **Phase 5**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

Build order: foundation & auth → home + AI UI → Bible & journal persistence → personalization → mobile.
