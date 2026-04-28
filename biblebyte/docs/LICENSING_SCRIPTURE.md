# Scripture licensing & attribution (blocking real launch)

Ship **placeholder** copy everywhere until publisher/licensing workflows clear. Code pointers:

- `src/config/scripture.ts` — translation policy constants + default attribution line.
- SQL seeds — comments tagged `TODO[NIV_LICENSE]` on `daily_verses` and similar tables.

## Product / legal checklist (non-exhaustive)

1. **Rights holder** — Confirm who grants redistribution for your chosen translation (e.g. NIV via Bible Gateway API / Hodder / regional distributor—your counsel verifies).
2. **Channels** — Web app, cached offline bundles, widgets, push snippets, analytics/logging—each may need explicit permission.
3. **Attribution** — Exact wording, placement (reader footer, widgets, notifications), and trademark rules.
4. **Rate & volume limits** — API quotas for verse-of-day vs full-chapter reads.
5. **Territories** — Geo restrictions may apply.
6. **Audit trail** — Document approval dates and renewal dates for compliance reviews.

Engineering cannot substitute legal sign-off—keep placeholders until counsel says otherwise.

Implementation map:

- `src/config/scripture.ts` — env flags, cache/offline policy, surface gates (widget/push).
- `src/lib/scripture/*` — provider abstraction (`mock`, `public_domain`, `licensed_niv`, `api_bible`).
- `GET /api/scripture/chapters` — server-only for all `SCRIPTURE_PROVIDER_MODE` values; mobile/web must not call API.Bible directly.
- `GET /api/scripture/bibles`, `books`, `passages`, `search` — server-only API.Bible proxies; **enabled only when `SCRIPTURE_PROVIDER_MODE=api_bible`** (otherwise HTTP 503). Logs avoid full verse bodies at info level.
