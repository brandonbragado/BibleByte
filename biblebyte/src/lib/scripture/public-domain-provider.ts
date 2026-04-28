import { getBookByCode } from "@/lib/bible/canon";
import { buildMockChapterPassage } from "@/lib/scripture/mock-provider";
import type { ChapterPassage, ScriptureProvider } from "@/lib/scripture/types";

/**
 * Slot for a future **legal** public-domain API (e.g. curated KJV/XML sources with compliant terms).
 * Today: same structural placeholder as mock, different attribution — never scrape third-party sites.
 */
export class PublicDomainScriptureProvider implements ScriptureProvider {
  readonly id = "public_domain" as const;

  async getChapter(bookCode: string, chapter: number): Promise<ChapterPassage> {
    const book = getBookByCode(bookCode);
    if (!book || chapter < 1 || chapter > book.chapters) {
      throw new Error("Invalid book or chapter.");
    }
    const base = buildMockChapterPassage(book, chapter);
    return {
      ...base,
      providerId: "public_domain",
      isPlaceholder: true,
      suppressOfflineBundle: true,
      attribution: {
        translationLabel: "Public domain (planned)",
        detail:
          "TODO[NIV_LICENSE]: Wire a rights-cleared public-domain provider API — no web scraping; placeholder lines only today.",
        requiresVisibleAttribution: true,
      },
    };
  }
}
