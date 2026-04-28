# Supabase Auth Provider Setup (Google now, Apple later)

This project uses Expo Auth Session with custom scheme redirect URIs.

## 1) Environment Variables

Set these in `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://aoagpxxlrpbgpdotvyeu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_SENTRY_DSN=
```

Set these in `apps/api/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_JWKS_URL=https://YOUR_PROJECT_REF.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_ISSUER=https://YOUR_PROJECT_REF.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Do not place `SUPABASE_SERVICE_ROLE_KEY` in mobile env files.

## 2) Environment + Callback Matrix


| Environment      | Mobile bundle/package           | Redirect URI                            | Supabase Site URL                    | Supabase Additional Redirect URLs                                                                                                                                                                                     |
| ---------------- | ------------------------------- | --------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dev (Expo Go)    | n/a                             | `exp://127.0.0.1:8081/--/auth/callback` | `biblebites://auth/callback`         | `exp://127.0.0.1:8081/--/auth/callback`, `exp://127.0.0.1:8081/--/auth/reset`, `exp://localhost:8081/--/auth/callback`, `exp://localhost:8081/--/auth/reset`, `biblebites://auth/callback`, `biblebites://auth/reset` |
| staging (EAS)    | `com.biblebites.mobile.staging` | `biblebites-staging://auth/callback`    | `biblebites-staging://auth/callback` | `biblebites-staging://auth/callback`, `biblebites-staging://auth/reset`                                                                                                                                               |
| production (EAS) | `com.biblebites.mobile`         | `biblebites://auth/callback`            | `biblebites://auth/callback`         | `biblebites://auth/callback`, `biblebites://auth/reset`                                                                                                                                                               |


Use a unique Supabase project per environment (`dev`, `staging`, `prod`) and matching URL + key pairs.

## 3) Provider Credential Matrix

### Google

- One Google Cloud project per environment is recommended.
- Configure OAuth consent and add redirect URI:
  - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- For native builds, configure Android SHA-1/SHA-256 fingerprints for each package name.
- Keep client IDs and secrets in Supabase provider settings only.

### Apple

- Optional for current dev scope. You can skip Apple setup until you are ready.
- Configure Sign In with Apple in Apple Developer for each environment.
- Required values in Supabase Apple provider:
  - Services ID
  - Team ID
  - Key ID
  - Private key
- Return/callback URL:
  - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- iOS app must have Sign In with Apple capability enabled.

## 4) Supabase Auth URL Configuration

In Supabase Dashboard:

- Authentication -> URL Configuration

Set:

- Site URL: `biblebites://auth/callback`
- Additional Redirect URLs:
  - `biblebites://auth/callback`
  - `biblebites://auth/reset`
  - `exp://127.0.0.1:8081/--/auth/callback`
  - `exp://127.0.0.1:8081/--/auth/reset`
  - `exp://localhost:8081/--/auth/callback`
  - `exp://localhost:8081/--/auth/reset`

If Expo runs on a different host/port, add the exact callback URL shown by the app logs for `makeRedirectUri`.
The app now auto-selects:

- Expo Go/dev: `exp://.../--/auth/callback`
- Native builds: `biblebites://auth/callback`

## 5) Google Provider Setup

In Supabase Dashboard:

- Authentication -> Providers -> Google

Enable Google and use OAuth credentials from Google Cloud Console.

In Google Cloud Console, add authorized redirect URI:

- `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

The app surfaces **Continue with Google** as the primary path on Welcome, Sign in, and Sign up. Google still **must** be enabled here and wired to real OAuth credentials; otherwise the button opens Supabase authorize and fails.

**Minimum checklist for Google to succeed**

1. `**apps/mobile/.env`** — `EXPO_PUBLIC_SUPABASE_URL` is your real `https://<project-ref>.supabase.co` (not `example.supabase.co`), and `EXPO_PUBLIC_SUPABASE_ANON_KEY` matches that project.
2. **Redirect URLs** — Add every URL your dev clients use (e.g. `http://localhost:8086/auth/callback`, `http://localhost:8087/auth/callback`, Expo Go `exp://.../--/auth/callback`, native `biblebites://auth/callback`) under Authentication → URL Configuration.
3. **Google Cloud** — OAuth client authorized redirect includes `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Restart Expo after changing `.env`.

## 6) Apple Provider Setup

In Supabase Dashboard:

- Authentication -> Providers -> Apple

Enable Apple and provide:

- Services ID
- Team ID
- Key ID
- Private key

Apple redirect target remains Supabase callback:

- `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

In Apple developer configuration, allow app return via:

- `biblebites://auth/callback`

## 7) Dev-only email/password test account (optional)

Use this when you want **predictable credentials** on your Supabase project (local/dev only).

**Defaults** (override with env vars when running the script):


| Variable                  | Default                  |
| ------------------------- | ------------------------ |
| `DEV_TEST_LOGIN_EMAIL`    | `dev-test@biblebyte.dev` |
| `DEV_TEST_LOGIN_PASSWORD` | `BibleByte_Dev_12345!`   |


You can also set `DEV_TEST_LOGIN_EMAIL` / `DEV_TEST_LOGIN_PASSWORD` in `apps/api/.env` next to your Supabase keys.

From the repo root (loads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `apps/api/.env`):

```bash
npm run auth:create-dev-user
```

Then in the app: **Sign in** → enter that email and password. The script confirms the email automatically via the Admin API (`email_confirm: true`).

Never enable weak passwords like this on production projects or reuse this password elsewhere.

## 8) Local Validation Flow

1. Start app with `npm run dev:mobile`
2. Test `Create Account` (email/password)
3. Log out, then test `Log In` (email/password)
4. Test `Forgot password` email dispatch
5. Test Google auth
6. Test Apple auth (iOS device/simulator with Apple account)
7. Confirm onboarding writes:
  - `user_preferences`
  - `notification_schedules`

