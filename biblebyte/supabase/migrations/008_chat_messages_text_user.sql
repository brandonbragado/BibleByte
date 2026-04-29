-- AI companion: chat_messages store plain text + user_id for strict RLS and mobile-friendly API.
-- Migrates legacy jsonb content (user_text / structured blocks) to plain text, or copies text if already text.

alter table public.chat_messages
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

update public.chat_messages m
set user_id = s.user_id
from public.chat_sessions s
where m.session_id = s.id
  and m.user_id is null;

alter table public.chat_messages
  alter column user_id set not null;

alter table public.chat_messages
  add column if not exists content_plain text;

-- Branch on actual column type: jsonb (from 001) vs text (manual / other env).
do $migrate$
declare
  content_is_jsonb boolean;
begin
  select a.atttypid = 'jsonb'::regtype
  into content_is_jsonb
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'chat_messages'
    and a.attname = 'content'
    and not a.attisdropped
    and a.attnum > 0;

  if content_is_jsonb then
    update public.chat_messages
    set content_plain = case
      when jsonb_typeof(content) = 'object'
        and coalesce(content->>'kind', '') = 'user_text'
        then coalesce(content->>'text', '')
      when jsonb_typeof(content) = 'object'
        and coalesce(content->>'kind', '') = 'structured'
        then trim(
          both
          from concat_ws(
            E'\n\n',
            'Understanding',
            nullif(trim(coalesce(content#>>'{blocks,understanding}', '')), ''),
            'Scripture',
            nullif(trim(coalesce(content#>>'{blocks,scripture}', '')), ''),
            'Life application',
            nullif(trim(coalesce(content#>>'{blocks,application}', '')), ''),
            'Prayer',
            nullif(trim(coalesce(content#>>'{blocks,prayer}', '')), '')
          )
        )
      else trim(both from content::text)
    end
    where content_plain is null;
  else
    update public.chat_messages
    set content_plain = trim(both from content::text)
    where content_plain is null;
  end if;
end
$migrate$;

update public.chat_messages
set content_plain = coalesce(nullif(content_plain, ''), '(legacy message)')
where content_plain is null;

alter table public.chat_messages
  drop column content;

alter table public.chat_messages
  rename column content_plain to content;

alter table public.chat_messages
  alter column content set not null;

comment on column public.chat_messages.user_id is 'Owner of the row; must match session owner for RLS.';
comment on column public.chat_messages.content is 'Plain-text message body (user, assistant, or system).';

drop policy if exists "Users read own messages" on public.chat_messages;
drop policy if exists "Users insert own messages" on public.chat_messages;
drop policy if exists "Users delete own messages" on public.chat_messages;

create policy "Users read own messages"
  on public.chat_messages
  for select
  using (auth.uid() = user_id);

create policy "Users insert own messages"
  on public.chat_messages
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.chat_sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users delete own messages"
  on public.chat_messages
  for delete
  using (auth.uid() = user_id);



