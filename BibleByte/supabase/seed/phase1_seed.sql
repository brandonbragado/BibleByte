-- Phase 1 seed content with NIV-safe placeholders only.
-- TODO[NIV_LICENSE]: Replace placeholder verse text after legal/license approval.
--
-- This seed:
--   1. Inserts the full 66-book canon with testament + book_group metadata so
--      the Bible tab UI renders the complete library shell, even though most
--      chapters/verses remain unseeded until licensing is in place.
--   2. Seeds a small set of placeholder chapters/verses so the reader
--      experience renders end-to-end.
--   3. Inserts a daily-byte for the current date.
--
-- The script is fully idempotent: every insert uses ON CONFLICT DO NOTHING,
-- and the chapter/verse step joins through `bible_chapters` directly rather
-- than the previous CTE-only path (which silently skipped verses on every
-- re-run because the inserted_chapters CTE only returned freshly-inserted
-- rows).

-- 1. Books: full 66-book canon with grouping --------------------------------
insert into public.bible_books (name, order_index, testament, book_group)
values
  -- Old Testament
  ('Genesis',          1,  'old', 'pentateuch'),
  ('Exodus',           2,  'old', 'pentateuch'),
  ('Leviticus',        3,  'old', 'pentateuch'),
  ('Numbers',          4,  'old', 'pentateuch'),
  ('Deuteronomy',      5,  'old', 'pentateuch'),
  ('Joshua',           6,  'old', 'historical'),
  ('Judges',           7,  'old', 'historical'),
  ('Ruth',             8,  'old', 'historical'),
  ('1 Samuel',         9,  'old', 'historical'),
  ('2 Samuel',         10, 'old', 'historical'),
  ('1 Kings',          11, 'old', 'historical'),
  ('2 Kings',          12, 'old', 'historical'),
  ('1 Chronicles',     13, 'old', 'historical'),
  ('2 Chronicles',     14, 'old', 'historical'),
  ('Ezra',             15, 'old', 'historical'),
  ('Nehemiah',         16, 'old', 'historical'),
  ('Esther',           17, 'old', 'historical'),
  ('Job',              18, 'old', 'wisdom'),
  ('Psalms',           19, 'old', 'wisdom'),
  ('Proverbs',         20, 'old', 'wisdom'),
  ('Ecclesiastes',     21, 'old', 'wisdom'),
  ('Song of Songs',    22, 'old', 'wisdom'),
  ('Isaiah',           23, 'old', 'major_prophets'),
  ('Jeremiah',         24, 'old', 'major_prophets'),
  ('Lamentations',     25, 'old', 'major_prophets'),
  ('Ezekiel',          26, 'old', 'major_prophets'),
  ('Daniel',           27, 'old', 'major_prophets'),
  ('Hosea',            28, 'old', 'minor_prophets'),
  ('Joel',             29, 'old', 'minor_prophets'),
  ('Amos',             30, 'old', 'minor_prophets'),
  ('Obadiah',          31, 'old', 'minor_prophets'),
  ('Jonah',            32, 'old', 'minor_prophets'),
  ('Micah',            33, 'old', 'minor_prophets'),
  ('Nahum',            34, 'old', 'minor_prophets'),
  ('Habakkuk',         35, 'old', 'minor_prophets'),
  ('Zephaniah',        36, 'old', 'minor_prophets'),
  ('Haggai',           37, 'old', 'minor_prophets'),
  ('Zechariah',        38, 'old', 'minor_prophets'),
  ('Malachi',          39, 'old', 'minor_prophets'),
  -- New Testament
  ('Matthew',          40, 'new', 'gospels'),
  ('Mark',             41, 'new', 'gospels'),
  ('Luke',             42, 'new', 'gospels'),
  ('John',             43, 'new', 'gospels'),
  ('Acts',             44, 'new', 'acts_history'),
  ('Romans',           45, 'new', 'pauline_letters'),
  ('1 Corinthians',    46, 'new', 'pauline_letters'),
  ('2 Corinthians',    47, 'new', 'pauline_letters'),
  ('Galatians',        48, 'new', 'pauline_letters'),
  ('Ephesians',        49, 'new', 'pauline_letters'),
  ('Philippians',      50, 'new', 'pauline_letters'),
  ('Colossians',       51, 'new', 'pauline_letters'),
  ('1 Thessalonians',  52, 'new', 'pauline_letters'),
  ('2 Thessalonians',  53, 'new', 'pauline_letters'),
  ('1 Timothy',        54, 'new', 'pauline_letters'),
  ('2 Timothy',        55, 'new', 'pauline_letters'),
  ('Titus',            56, 'new', 'pauline_letters'),
  ('Philemon',         57, 'new', 'pauline_letters'),
  ('Hebrews',          58, 'new', 'general_letters'),
  ('James',            59, 'new', 'general_letters'),
  ('1 Peter',          60, 'new', 'general_letters'),
  ('2 Peter',          61, 'new', 'general_letters'),
  ('1 John',           62, 'new', 'general_letters'),
  ('2 John',           63, 'new', 'general_letters'),
  ('3 John',           64, 'new', 'general_letters'),
  ('Jude',             65, 'new', 'general_letters'),
  ('Revelation',       66, 'new', 'apocalyptic')
on conflict (name) do update set
  order_index = excluded.order_index,
  testament   = excluded.testament,
  book_group  = excluded.book_group;

-- 2. Placeholder chapters --------------------------------------------------
insert into public.bible_chapters (book_id, chapter_number)
select b.id, c.chapter_number
from public.bible_books b
join (
  values
    ('Psalms', 23),
    ('Psalms', 91),
    ('Proverbs', 3),
    ('John', 3),
    ('John', 14)
) as c(book_name, chapter_number) on c.book_name = b.name
on conflict (book_id, chapter_number) do nothing;

-- 3. Placeholder verses ----------------------------------------------------
-- Joined through `bible_chapters` so re-runs always pick up the previously
-- inserted chapters (fixes the CTE-only bug from the prior seed).
insert into public.bible_verses (chapter_id, verse_number, verse_text, translation, is_placeholder)
select ch.id, v.verse_number, v.verse_text, 'NIV', true
from public.bible_chapters ch
join public.bible_books b on b.id = ch.book_id
join (
  values
    ('Psalms',   23, 1,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 23:1.'),
    ('Psalms',   23, 2,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 23:2.'),
    ('Psalms',   23, 3,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 23:3.'),
    ('Psalms',   23, 4,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 23:4.'),
    ('Psalms',   23, 5,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 23:5.'),
    ('Psalms',   23, 6,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 23:6.'),
    ('Psalms',   91, 1,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 91:1.'),
    ('Psalms',   91, 2,  'TODO[NIV_LICENSE]: Verse text placeholder for Psalms 91:2.'),
    ('Proverbs', 3,  5,  'TODO[NIV_LICENSE]: Verse text placeholder for Proverbs 3:5.'),
    ('Proverbs', 3,  6,  'TODO[NIV_LICENSE]: Verse text placeholder for Proverbs 3:6.'),
    ('John',     3,  16, 'TODO[NIV_LICENSE]: Verse text placeholder for John 3:16.'),
    ('John',     3,  17, 'TODO[NIV_LICENSE]: Verse text placeholder for John 3:17.'),
    ('John',     14, 1,  'TODO[NIV_LICENSE]: Verse text placeholder for John 14:1.'),
    ('John',     14, 6,  'TODO[NIV_LICENSE]: Verse text placeholder for John 14:6.'),
    ('John',     14, 27, 'TODO[NIV_LICENSE]: Verse text placeholder for John 14:27.')
) as v(book_name, chapter_number, verse_number, verse_text)
  on v.book_name = b.name and v.chapter_number = ch.chapter_number
on conflict (chapter_id, verse_number) do nothing;

-- 4. Daily-byte for today ---------------------------------------------------
insert into public.daily_bytes (
  date,
  verse_reference,
  verse_text,
  summary,
  reflection_question,
  prayer_prompt,
  estimated_minutes,
  translation,
  is_placeholder
)
values (
  current_date,
  'Proverbs 3:5-6',
  'TODO[NIV_LICENSE]: Licensed NIV text renders here once approved.',
  'Trusting God over self-reliance creates clarity in uncertain moments.',
  'Where are you relying only on your own understanding right now?',
  'God, guide my steps today and align my heart with Your wisdom.',
  5,
  'NIV',
  true
)
on conflict (date) do nothing;
