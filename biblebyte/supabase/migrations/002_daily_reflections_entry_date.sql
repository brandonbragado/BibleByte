-- One reflection row per user per calendar day (UTC). Run after 001_biblebyte_core.sql.

alter table public.daily_reflections
  add column if not exists entry_date date;

update public.daily_reflections
set entry_date = (created_at at time zone 'utc')::date
where entry_date is null;

alter table public.daily_reflections
  alter column entry_date set default ((timezone('utc', now()))::date);

alter table public.daily_reflections
  alter column entry_date set not null;

create unique index if not exists daily_reflections_user_entry_unique
  on public.daily_reflections (user_id, entry_date);

comment on column public.daily_reflections.entry_date is 'UTC calendar date for daily reflection grouping.';
