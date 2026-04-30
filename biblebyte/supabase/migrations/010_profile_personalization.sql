-- Optional personable fields — user-authored only; never inferred from behavior.

alter table public.user_profiles
  add column if not exists profile_bio text,
  add column if not exists profile_monthly_focus text;

comment on column public.user_profiles.profile_bio is 'Optional short line the user writes (what they are leaning into).';
comment on column public.user_profiles.profile_monthly_focus is 'Optional user-declared “focus this month” — explicit entry only.';
