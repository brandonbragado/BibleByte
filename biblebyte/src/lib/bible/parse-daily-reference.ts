import type { BibleBookMeta } from "@/lib/bible/canon";
import { BIBLE_BOOKS } from "@/lib/bible/canon";

export type ParsedDailyReference = {
  bookCode: string;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
};

/** Strip seed suffix for UI (e.g. `John 3:16 (placeholder)` → `John 3:16`). */
export function displayDailyVerseReference(reference: string): string {
  return reference.replace(/\s*\(placeholder\)\s*$/i, "").trim();
}

/** Strip seed suffix like `John 3:16 (placeholder)`. */
function stripPlaceholderSuffix(ref: string): string {
  return displayDailyVerseReference(ref);
}

function normalizeBookLookup(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === "psalm") return "psalms";
  return n;
}

/** Longest name first so `1 Corinthians` wins over `Corinthians`. */
function resolveBook(bookFragment: string): BibleBookMeta | undefined {
  const n = normalizeBookLookup(bookFragment);
  const sorted = [...BIBLE_BOOKS].sort((a, b) => b.name.length - a.name.length);
  const exact = sorted.find((b) => b.name.toLowerCase() === n);
  if (exact) return exact;
  return sorted.find((b) => n.startsWith(b.name.toLowerCase()));
}

/**
 * Parse admin-seeded `daily_verses.reference` values (e.g. `John 3:16 (placeholder)`,
 * `Psalm 23:1–3 (placeholder)`) into canon book + chapter + inclusive verse range.
 */
export function parseDailyVerseReference(reference: string): ParsedDailyReference | null {
  const cleaned = stripPlaceholderSuffix(reference);
  if (!cleaned) return null;

  const m = cleaned.match(
    /^(.+?)\s+(\d+)\s*:\s*(\d+)(?:\s*[\u2013\u2014-]\s*(\d+))?\s*$/
  );
  if (!m) return null;

  const bookPart = m[1]?.trim() ?? "";
  const chapter = Number.parseInt(m[2] ?? "", 10);
  const verseStart = Number.parseInt(m[3] ?? "", 10);
  const verseEndRaw = m[4] != null ? Number.parseInt(m[4], 10) : verseStart;

  if (!bookPart || !Number.isFinite(chapter) || !Number.isFinite(verseStart)) return null;

  const book = resolveBook(bookPart);
  if (!book || chapter < 1 || chapter > book.chapters) return null;

  const verseEnd = Number.isFinite(verseEndRaw) ? verseEndRaw : verseStart;
  const lo = Math.min(verseStart, verseEnd);
  const hi = Math.max(verseStart, verseEnd);

  return {
    bookCode: book.code,
    bookName: book.name,
    chapter,
    verseStart: lo,
    verseEnd: hi,
  };
}
