import { supabase } from "./supabase/client";

export type ScriptureSpotlight = {
  verseId: string;
  reference: string;
  verseText: string;
};

function hashToUint32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic index in `[0, length)` from a date key (YYYY-MM-DD). */
export function deterministicIndexForDay(dateKey: string, length: number): number {
  if (length <= 0) return 0;
  return hashToUint32(`biblebyte:sotd:${dateKey}`) % length;
}

type VerseRow = {
  id: string;
  verse_number: number;
  verse_text: string;
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
};

function pickRelationOne<T extends Record<string, unknown> | null>(
  value: T | T[] | null | undefined
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function rowToSpotlight(row: VerseRow): ScriptureSpotlight | null {
  const chapter = pickRelationOne(row.bible_chapters);
  if (!chapter) return null;
  const book = pickRelationOne(chapter.bible_books);
  const bookName = book?.name ?? "Unknown";
  const chapterNumber = chapter.chapter_number ?? "?";
  const reference = `${bookName} ${chapterNumber}:${row.verse_number}`;
  return {
    verseId: row.id,
    reference,
    verseText: row.verse_text
  };
}

async function fetchSpotlightCandidates(): Promise<ScriptureSpotlight[]> {
  const { data, error } = await supabase
    .from("bible_verses")
    .select("id, verse_number, verse_text, bible_chapters(chapter_number, bible_books(name))")
    .limit(500);
  if (error) {
    throw error;
  }
  const rows = (data ?? []) as unknown as VerseRow[];
  return rows.map(rowToSpotlight).filter((row): row is ScriptureSpotlight => row !== null);
}

/**
 * Returns a stable "random" verse for the calendar day: same pick for everyone
 * on that day, reshuffled when the UTC date rolls over.
 */
export async function fetchScriptureOfTheDay(dateKey?: string): Promise<ScriptureSpotlight | null> {
  const day = dateKey ?? new Date().toISOString().slice(0, 10);
  const candidates = await fetchSpotlightCandidates();
  if (candidates.length === 0) {
    return null;
  }
  const idx = deterministicIndexForDay(day, candidates.length);
  return candidates[idx] ?? null;
}
