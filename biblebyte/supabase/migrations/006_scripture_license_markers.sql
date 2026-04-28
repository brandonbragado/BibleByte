-- TODO[NIV_LICENSE]: Documentation-only markers for scripture seed surfaces (no new tables).

comment on table public.daily_verses is
  'Rotating verse-of-day placeholders. TODO[NIV_LICENSE]: Do not store full NIV text here unless licensing explicitly permits; app layer gates widgets/push via SCRIPTURE_ALLOW_* env flags.';

comment on column public.daily_verses.body_placeholder is
  'TODO[NIV_LICENSE]: Placeholder until licensed API delivery; never scrape third-party sites to populate.';

comment on column public.daily_verses.reference is
  'TODO[NIV_LICENSE]: Citation only — not a substitute for licensed passage payload.';

comment on column public.daily_verses.attribution_note is
  'TODO[NIV_LICENSE]: Replace with publisher-required attribution when rights clear.';
