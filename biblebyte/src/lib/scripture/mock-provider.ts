import {
  SCRIPTURE_DEFAULT_ATTRIBUTION,
  SCRIPTURE_MOCK_VERSE_CAP,
  SCRIPTURE_TRANSLATION_LABEL,
} from "@/config/scripture";
import type { BibleBookMeta } from "@/lib/bible/canon";
import { getBookByCode } from "@/lib/bible/canon";
import type { ChapterPassage, ScriptureProvider } from "@/lib/scripture/types";

/** Single verse placeholder — never real NIV; TODO[NIV_LICENSE] on all seed/demo paths. */
function versePlaceholder(bookCode: string, chapter: number, verse: number): string {
  return `Mock scripture line — replace via licensed provider only after rights clear. (${bookCode} ${chapter}:${verse})`;
}

export function buildMockChapterPassage(book: BibleBookMeta, chapter: number): ChapterPassage {
  const count = SCRIPTURE_MOCK_VERSE_CAP;
  const verses = Array.from({ length: count }, (_, i) => ({
    verseNumber: i + 1,
    text: versePlaceholder(book.code, chapter, i + 1),
  }));

  return {
    bookCode: book.code,
    bookName: book.name,
    chapter,
    verses,
    providerId: "mock",
    isPlaceholder: true,
    suppressOfflineBundle: true,
    attribution: {
      translationLabel: SCRIPTURE_TRANSLATION_LABEL,
      detail: `${SCRIPTURE_DEFAULT_ATTRIBUTION} Mock provider — no copyrighted text.`,
      requiresVisibleAttribution: true,
    },
  };
}

export class MockScriptureProvider implements ScriptureProvider {
  readonly id = "mock" as const;

  async getChapter(bookCode: string, chapter: number): Promise<ChapterPassage> {
    const book = getBookByCode(bookCode);
    if (!book || chapter < 1 || chapter > book.chapters) {
      throw new Error("Invalid book or chapter.");
    }
    return buildMockChapterPassage(book, chapter);
  }
}
