# Social Auth Test Matrix (Google + Apple)

Use this checklist before promoting builds to staging/production.

## Devices and Builds

- iOS simulator (debug)
- iOS physical device (debug + release)
- Android emulator (debug)
- Android physical device (release)

## Sign-In Flows

- [ ] Google login succeeds on iOS and returns to `biblebites://auth/callback`.
- [ ] Google login succeeds on Android and returns to `biblebites://auth/callback`.
- [ ] Apple login succeeds on iOS and returns to `biblebites://auth/callback`.
- [ ] Apple login rejection/cancel shows non-blocking error state in app.

## Session and Deep Link Behavior

- [ ] App cold start restores session from secure storage.
- [ ] `GET /v1/auth/me` returns expected authenticated user shape.
- [ ] Reminder notification deep-link opens `lesson/today` route when tapped.
- [ ] Invalid/expired bearer token is rejected by API guard.

## Anonymous Upgrade Flow

- [ ] Anonymous user completes onboarding before sign-in.
- [ ] User signs in with Google/Apple.
- [ ] Existing onboarding preferences remain intact after sign-in.
- [ ] Existing progress/streak rows remain associated with upgraded account.

## Logout and Account Deletion

- [ ] `POST /v1/auth/logout` returns success and app clears local session.
- [ ] `DELETE /v1/auth/account` marks account deleted in backend response.
- [ ] After deletion, protected endpoints are inaccessible with old token.

## Compliance and Security Checks

- [ ] Confirm no `service_role` key exists in mobile env files.
- [ ] Confirm JWT verification enforces issuer and audience checks.
- [ ] Confirm NIV text remains placeholder-only without licensing.
- [ ] Confirm analytics captures `notification_opened` and auth-adjacent events only with opt-in.
