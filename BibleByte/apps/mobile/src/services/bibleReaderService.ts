import type { BookGroup, HighlightColor, Testament } from "@biblebites/contracts";
import { supabase } from "./supabase/client";
import { getAuthenticatedUser, requireAuthenticatedUser } from "./supabase/auth";

export type BibleBook = {
  id: string;
  name: string;
  orderIndex: number;
  testament: Testament;
  bookGroup: BookGroup | null;
};
export type BibleChapter = { id: string; chapterNumber: number };
export type BibleVerse = { id: string; verseNumber: number; verseText: string };

export type BibleBookGroup = {
  group: BookGroup;
  label: string;
  books: BibleBook[];
};

export type GroupedBibleBooks = {
  oldTestament: BibleBookGroup[];
  newTestament: BibleBookGroup[];
};

export type ReadingPosition = {
  bookId: string;
  bookName: string;
  chapterId: string;
  chapterNumber: number;
  verseId: string | null;
  verseNumber: number | null;
  updatedAt: string;
};

export type ReferenceJump = {
  bookName: string;
  chapterNumber: number;
  verseNumber: number | null;
};

export type ReferenceJumpResolution = {
  parsed: ReferenceJump;
  bookId: string;
  bookName: string;
  chapterId: string;
  chapterNumber: number;
  verseId: string | null;
  verseNumber: number | null;
};

const BOOK_GROUP_LABELS: Record<BookGroup, string> = {
  pentateuch: "Pentateuch",
  historical: "Historical",
  wisdom: "Wisdom & Poetry",
  major_prophets: "Major Prophets",
  minor_prophets: "Minor Prophets",
  gospels: "Gospels",
  acts_history: "Acts",
  pauline_letters: "Pauline Letters",
  general_letters: "General Letters",
  apocalyptic: "Apocalyptic"
};

const TESTAMENT_BOOK_GROUP_ORDER: Record<Testament, BookGroup[]> = {
  old: ["pentateuch", "historical", "wisdom", "major_prophets", "minor_prophets"],
  new: ["gospels", "acts_history", "pauline_letters", "general_letters", "apocalyptic"]
};

// ---------- Reads --------------------------------------------------------

export async function fetchBibleBooks(): Promise<BibleBook[]> {
  const { data, error } = await supabase
    .from("bible_books")
    .select("id,name,order_index,testament,book_group")
    .order("order_index", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    orderIndex: row.order_index,
    testament: row.testament,
    bookGroup: row.book_group
  }));
}

export async function fetchBibleBooksGrouped(): Promise<GroupedBibleBooks> {
  const books = await fetchBibleBooks();
  return groupBooks(books);
}

export function groupBooks(books: BibleBook[]): GroupedBibleBooks {
  const buildSection = (testament: Testament): BibleBookGroup[] => {
    return TESTAMENT_BOOK_GROUP_ORDER[testament]
      .map((group) => {
        const groupBooks = books
          .filter((book) => book.testament === testament && book.bookGroup === group)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        return { group, label: BOOK_GROUP_LABELS[group], books: groupBooks };
      })
      .filter((section) => section.books.length > 0);
  };

  return {
    oldTestament: buildSection("old"),
    newTestament: buildSection("new")
  };
}

export async function fetchChaptersByBook(bookId: string): Promise<BibleChapter[]> {
  const { data, error } = await supabase
    .from("bible_chapters")
    .select("id,chapter_number")
    .eq("book_id", bookId)
    .order("chapter_number", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({ id: row.id, chapterNumber: row.chapter_number }));
}

export async function fetchVersesByChapter(chapterId: string): Promise<BibleVerse[]> {
  const { data, error } = await supabase
    .from("bible_verses")
    .select("id,verse_number,verse_text")
    .eq("chapter_id", chapterId)
    .order("verse_number", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    verseNumber: row.verse_number,
    verseText: row.verse_text
  }));
}

// ---------- Search -------------------------------------------------------

export async function searchVerses(query: string): Promise<BibleVerse[]> {
  if (!query.trim()) {
    return [];
  }
  const { data, error } = await supabase
    .from("bible_verses")
    .select("id,verse_number,verse_text")
    .ilike("verse_text", `%${query.trim()}%`)
    .limit(25);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({ id: row.id, verseNumber: row.verse_number, verseText: row.verse_text }));
}

// Reference parser: handles common shorthand like
//   "John 3:16", "1 John 4", "Ps 23:1", "1 Cor 13", "Genesis 1:1"
// Books with leading numerals (1/2/3) are matched via fuzzy book-name lookup.
const REFERENCE_REGEX = /^\s*(\d?\s*[A-Za-z][A-Za-z .'-]*?)\s*(\d+)(?:\s*[:.]\s*(\d+))?\s*$/;
const BOOK_ALIASES: Record<string, string[]> = {
  Genesis: ["gen", "ge", "gn"],
  Exodus: ["ex", "exo", "exod"],
  Leviticus: ["lev", "lv"],
  Numbers: ["num", "nm", "nu"],
  Deuteronomy: ["deut", "dt", "deu"],
  Joshua: ["josh", "jos"],
  Judges: ["judg", "jdg"],
  Ruth: ["ru"],
  "1 Samuel": ["1 sam", "1sa", "1sm"],
  "2 Samuel": ["2 sam", "2sa", "2sm"],
  "1 Kings": ["1 kgs", "1ki"],
  "2 Kings": ["2 kgs", "2ki"],
  "1 Chronicles": ["1 chr", "1ch"],
  "2 Chronicles": ["2 chr", "2ch"],
  Ezra: ["ezr"],
  Nehemiah: ["neh"],
  Esther: ["est"],
  Job: ["jb"],
  Psalms: ["ps", "psa", "psalm", "pss"],
  Proverbs: ["prov", "pr", "pro"],
  Ecclesiastes: ["ecc", "qoh"],
  "Song of Songs": ["song", "ss", "sos"],
  Isaiah: ["isa", "is"],
  Jeremiah: ["jer"],
  Lamentations: ["lam"],
  Ezekiel: ["eze", "ezk"],
  Daniel: ["dan", "dn"],
  Hosea: ["hos"],
  Joel: ["joe"],
  Amos: ["am"],
  Obadiah: ["oba"],
  Jonah: ["jon"],
  Micah: ["mic"],
  Nahum: ["nah"],
  Habakkuk: ["hab"],
  Zephaniah: ["zep"],
  Haggai: ["hag"],
  Zechariah: ["zec"],
  Malachi: ["mal"],
  Matthew: ["matt", "mt"],
  Mark: ["mk"],
  Luke: ["lk"],
  John: ["jn"],
  Acts: ["act"],
  Romans: ["rom"],
  "1 Corinthians": ["1 cor", "1co"],
  "2 Corinthians": ["2 cor", "2co"],
  Galatians: ["gal"],
  Ephesians: ["eph"],
  Philippians: ["phil", "php"],
  Colossians: ["col"],
  "1 Thessalonians": ["1 thes", "1th"],
  "2 Thessalonians": ["2 thes", "2th"],
  "1 Timothy": ["1 tim", "1ti"],
  "2 Timothy": ["2 tim", "2ti"],
  Titus: ["ti"],
  Philemon: ["phlm"],
  Hebrews: ["heb"],
  James: ["jas"],
  "1 Peter": ["1 pet", "1pe"],
  "2 Peter": ["2 pet", "2pe"],
  "1 John": ["1 jn", "1jo"],
  "2 John": ["2 jn", "2jo"],
  "3 John": ["3 jn", "3jo"],
  Jude: ["jud"],
  Revelation: ["rev", "rv"]
};

function normalizeBookKey(input: string): string {
  return input.replace(/\s+/g, " ").trim().toLowerCase();
}

function resolveCanonicalBookName(rawBookName: string, knownBooks: BibleBook[]): string | null {
  const normalized = normalizeBookKey(rawBookName);
  // Direct or case-insensitive match against actual seeded book names.
  const direct = knownBooks.find((book) => normalizeBookKey(book.name) === normalized);
  if (direct) {
    return direct.name;
  }
  // Alias / abbreviation lookup.
  for (const [canonical, aliases] of Object.entries(BOOK_ALIASES)) {
    if (aliases.includes(normalized)) {
      return canonical;
    }
  }
  // Last-ditch prefix match on canonical names (e.g. "philemon" → "Philemon").
  const prefix = knownBooks.find((book) => normalizeBookKey(book.name).startsWith(normalized));
  return prefix?.name ?? null;
}

export function parseReference(rawQuery: string, books: BibleBook[]): ReferenceJump | null {
  const match = rawQuery.match(REFERENCE_REGEX);
  if (!match) {
    return null;
  }
  const [, rawBook, rawChapter, rawVerse] = match;
  const canonical = resolveCanonicalBookName(rawBook, books);
  if (!canonical) {
    return null;
  }
  const chapterNumber = Number.parseInt(rawChapter, 10);
  const verseNumber = rawVerse ? Number.parseInt(rawVerse, 10) : null;
  if (!Number.isInteger(chapterNumber) || chapterNumber <= 0) {
    return null;
  }
  return { bookName: canonical, chapterNumber, verseNumber };
}

export async function resolveReferenceJump(parsed: ReferenceJump): Promise<ReferenceJumpResolution | null> {
  const { data: bookData, error: bookError } = await supabase
    .from("bible_books")
    .select("id,name")
    .eq("name", parsed.bookName)
    .maybeSingle();
  if (bookError) {
    throw bookError;
  }
  if (!bookData) {
    return null;
  }

  const { data: chapterData, error: chapterError } = await supabase
    .from("bible_chapters")
    .select("id,chapter_number")
    .eq("book_id", bookData.id)
    .eq("chapter_number", parsed.chapterNumber)
    .maybeSingle();
  if (chapterError) {
    throw chapterError;
  }
  if (!chapterData) {
    return null;
  }

  let verseId: string | null = null;
  let verseNumber: number | null = null;
  if (parsed.verseNumber !== null) {
    const { data: verseData, error: verseError } = await supabase
      .from("bible_verses")
      .select("id,verse_number")
      .eq("chapter_id", chapterData.id)
      .eq("verse_number", parsed.verseNumber)
      .maybeSingle();
    if (verseError) {
      throw verseError;
    }
    if (verseData) {
      verseId = verseData.id;
      verseNumber = verseData.verse_number;
    }
  }

  return {
    parsed,
    bookId: bookData.id,
    bookName: bookData.name,
    chapterId: chapterData.id,
    chapterNumber: chapterData.chapter_number,
    verseId,
    verseNumber
  };
}

// ---------- Saved verses -------------------------------------------------

export async function saveVerse(verseId: string): Promise<void> {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("saved_verses")
    .upsert({ user_id: user.id, verse_id: verseId }, { onConflict: "user_id,verse_id" });
  if (error) {
    throw error;
  }
}

export async function unsaveVerse(verseId: string): Promise<void> {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("saved_verses")
    .delete()
    .eq("user_id", user.id)
    .eq("verse_id", verseId);
  if (error) {
    throw error;
  }
}

export async function fetchSavedVerseIds(): Promise<Set<string>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return new Set();
  }
  const { data, error } = await supabase.from("saved_verses").select("verse_id").eq("user_id", user.id);
  if (error) {
    throw error;
  }
  return new Set((data ?? []).map((row) => row.verse_id));
}

// ---------- Reading position --------------------------------------------

export async function fetchLastReadingPosition(): Promise<ReadingPosition | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("reading_positions")
    .select(
      "book_id,chapter_id,verse_id,updated_at,bible_books(name),bible_chapters(chapter_number),bible_verses(verse_number)"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  type Row = {
    book_id: string;
    chapter_id: string;
    verse_id: string | null;
    updated_at: string;
    bible_books: { name: string | null } | { name: string | null }[] | null;
    bible_chapters: { chapter_number: number | null } | { chapter_number: number | null }[] | null;
    bible_verses: { verse_number: number | null } | { verse_number: number | null }[] | null;
  };
  const row = data as unknown as Row;
  const pickOne = <T,>(value: T | T[] | null | undefined): T | null => {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value ?? null;
  };
  const book = pickOne(row.bible_books);
  const chapter = pickOne(row.bible_chapters);
  const verse = pickOne(row.bible_verses);

  if (!book?.name || chapter?.chapter_number == null) {
    return null;
  }

  return {
    bookId: row.book_id,
    bookName: book.name,
    chapterId: row.chapter_id,
    chapterNumber: chapter.chapter_number,
    verseId: row.verse_id,
    verseNumber: verse?.verse_number ?? null,
    updatedAt: row.updated_at
  };
}

export async function upsertReadingPosition(input: {
  bookId: string;
  chapterId: string;
  verseId?: string | null;
}): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return;
  }
  const { error } = await supabase
    .from("reading_positions")
    .upsert(
      {
        user_id: user.id,
        book_id: input.bookId,
        chapter_id: input.chapterId,
        verse_id: input.verseId ?? null
      },
      { onConflict: "user_id" }
    );
  if (error) {
    throw error;
  }
}

// ---------- Highlights --------------------------------------------------

export type VerseHighlightRecord = {
  verseId: string;
  color: HighlightColor;
};

export type VerseHighlightDetail = VerseHighlightRecord & {
  reference: string;
  verseText: string;
  updatedAt: string;
};

export async function fetchHighlightsForChapter(chapterId: string): Promise<Map<string, HighlightColor>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return new Map();
  }
  // Fetch only the user's highlights for verses in this chapter via a server-side filter.
  const { data, error } = await supabase
    .from("verse_highlights")
    .select("verse_id,color,bible_verses!inner(chapter_id)")
    .eq("user_id", user.id)
    .eq("bible_verses.chapter_id", chapterId);
  if (error) {
    throw error;
  }
  const map = new Map<string, HighlightColor>();
  (data ?? []).forEach((row) => {
    map.set(row.verse_id, row.color as HighlightColor);
  });
  return map;
}

export async function setVerseHighlight(verseId: string, color: HighlightColor): Promise<void> {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("verse_highlights")
    .upsert(
      { user_id: user.id, verse_id: verseId, color },
      { onConflict: "user_id,verse_id" }
    );
  if (error) {
    throw error;
  }
}

export async function removeVerseHighlight(verseId: string): Promise<void> {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("verse_highlights")
    .delete()
    .eq("user_id", user.id)
    .eq("verse_id", verseId);
  if (error) {
    throw error;
  }
}

export async function fetchAllHighlights(): Promise<VerseHighlightDetail[]> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return [];
  }
  const { data, error } = await supabase
    .from("verse_highlights")
    .select(
      "verse_id,color,updated_at,bible_verses(verse_number,verse_text,bible_chapters(chapter_number,bible_books(name)))"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    throw error;
  }

  type Row = {
    verse_id: string;
    color: HighlightColor;
    updated_at: string;
    bible_verses:
      | {
          verse_number: number | null;
          verse_text: string | null;
          bible_chapters:
            | {
                chapter_number: number | null;
                bible_books: { name: string | null } | { name: string | null }[] | null;
              }
            | {
                chapter_number: number | null;
                bible_books: { name: string | null } | { name: string | null }[] | null;
              }[]
            | null;
        }
      | null;
  };

  const rows = data as unknown as Row[];
  return rows
    .map((row) => {
      const verse = row.bible_verses;
      if (!verse) {
        return null;
      }
      const chapter = Array.isArray(verse.bible_chapters)
        ? verse.bible_chapters[0]
        : verse.bible_chapters;
      if (!chapter) {
        return null;
      }
      const book = Array.isArray(chapter.bible_books) ? chapter.bible_books[0] : chapter.bible_books;
      const reference = `${book?.name ?? "Unknown"} ${chapter.chapter_number ?? "?"}:${verse.verse_number ?? "?"}`;
      return {
        verseId: row.verse_id,
        color: row.color,
        verseText: verse.verse_text ?? "Verse text unavailable.",
        reference,
        updatedAt: row.updated_at
      } satisfies VerseHighlightDetail;
    })
    .filter((value): value is VerseHighlightDetail => value !== null);
}

export { BOOK_GROUP_LABELS };
