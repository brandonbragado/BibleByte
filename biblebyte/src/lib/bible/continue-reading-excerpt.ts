import type { BibleBookMeta } from "@/lib/bible/canon";
import type { VerseLine } from "@/lib/scripture/types";

export type ContinueReadingExcerptOptions = {
  /** Max character length for the joined excerpt (ellipsis added when trimmed). */
  maxChars?: number;
  /** Verses before/after the bookmark verse to include when present (default 1). */
  neighborSpan?: number;
};

/**
 * Short plain-text preview around the reader bookmark (for Home “Continue reading”).
 * Does not invent scripture — only joins loaded verse lines.
 */
export function buildContinueReadingExcerpt(
  verses: VerseLine[],
  bookmarkVerse: number,
  opts?: ContinueReadingExcerptOptions
): string | null {
  if (!verses.length) return null;

  const maxChars = opts?.maxChars ?? 280;
  const neighborSpan = opts?.neighborSpan ?? 1;

  const byNum = new Map(verses.map((v) => [v.verseNumber, v]));
  const numbersPresent = [...byNum.keys()].sort((a, b) => a - b);
  const maxVerse = numbersPresent[numbersPresent.length - 1]!;
  const anchor = Math.min(Math.max(bookmarkVerse, 1), maxVerse);

  const include = new Set<number>();
  for (let d = -neighborSpan; d <= neighborSpan; d++) {
    const n = anchor + d;
    if (byNum.has(n)) include.add(n);
  }
  if (include.size === 0) {
    for (const v of verses.slice(0, 4)) include.add(v.verseNumber);
  }

  const ordered = [...include].sort((a, b) => a - b);
  const parts: string[] = [];
  for (const n of ordered) {
    const t = byNum.get(n)?.text?.trim() ?? "";
    if (t) parts.push(`${n}. ${t}`);
  }

  let out = parts.join(" ");
  if (!out) return null;
  if (out.length > maxChars) {
    out = out.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "…";
  }
  return out;
}

/** Non-quoted filler when licensed verse text isn’t loaded — keeps the card informative. */
export function buildContinueReadingContextBlurb(
  book: BibleBookMeta,
  chapter: number,
  verse: number
): string {
  const ref = verse > 1 ? `${book.name} ${chapter}:${verse}` : `${book.name} ${chapter}`;
  const era =
    book.testament === "OT"
      ? "the Old Testament’s witness to God’s covenant and care for his people"
      : "the New Testament’s witness to Jesus and life in the Spirit";
  return `${ref} is where you left off—part of ${era}. Continue below for the full chapter in your reader.`;
}
