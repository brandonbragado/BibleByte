-- Optional first/last name, phone on profile; email remains in auth.users (updated via Auth API).
alter table public.user_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text;

comment on column public.user_profiles.first_name is 'Preferred given name for greetings (Home).';
comment on column public.user_profiles.last_name is 'Family name — shown in profile editor only.';
comment on column public.user_profiles.phone is 'Optional contact phone — not verified in MVP.';
