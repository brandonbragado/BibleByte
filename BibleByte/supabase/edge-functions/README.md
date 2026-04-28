# Supabase Edge Functions (Phase 1)

These are function boundaries for MVP. Implement each in Deno runtime when wiring deployment.

- `daily-byte`
  - Purpose: fetch today's byte payload for authenticated user.
  - Input: none
  - Output: verse reference, placeholder NIV text, summary, reflection question, prayer prompt, estimated time.

- `lesson-complete`
  - Purpose: mark a daily byte complete and update streak atomically.
  - Input: `dailyByteId`, optional `reflectionText`, `completedAt`
  - Output: updated streak and completion result.

- `notification-dispatch`
  - Purpose: backend trigger endpoint for remote reminders.
  - Notes: keep no-op/logging behavior in MVP until APNs/FCM worker is added.
  - TODO[APNS_FCM]: integrate provider fanout with queue-based retries.

Security rules:
- Validate JWT for every request.
- Validate input payloads with strict schema checks.
- Enforce rate limits on public endpoints.
- Never expose service role keys in the mobile app.
