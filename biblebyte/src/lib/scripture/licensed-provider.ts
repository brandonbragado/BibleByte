import { isNivScriptureLicenseApproved } from "@/config/scripture";
import { getBookByCode } from "@/lib/bible/canon";
import { buildMockChapterPassage } from "@/lib/scripture/mock-provider";
import type { ChapterPassage, ScriptureProvider } from "@/lib/scripture/types";

/**
 * Licensed NIV (or equivalent) upstream — **server-side only**.
 *
 * - Never log full response bodies.
 * - Do not scrape Bible Gateway or other sites.
 * - TODO[NIV_LICENSE]: `fetch` to `SCRIPTURE_LICENSED_UPSTREAM_URL` with `SCRIPTURE_LICENSED_API_KEY`.
 */
export class LicensedNivScriptureProvider implements ScriptureProvider {
  readonly id = "licensed_niv" as const;

  async getChapter(bookCode: string, chapter: number): Promise<ChapterPassage> {
    const book = getBookByCode(bookCode);
    if (!book || chapter < 1 || chapter > book.chapters) {
      throw new Error("Invalid book or chapter.");
    }

    if (!isNivScriptureLicenseApproved()) {
      const fallback = buildMockChapterPassage(book, chapter);
      return {
        ...fallback,
        providerId: "licensed_niv",
        isPlaceholder: true,
        suppressOfflineBundle: true,
        attribution: {
          translationLabel: "NIV (unlicensed mode)",
          detail:
            "Licensed provider selected but NIV_SCRIPTURE_LICENSE_APPROVED is false — placeholder only.",
          requiresVisibleAttribution: true,
        },
      };
    }

    const url = process.env.SCRIPTURE_LICENSED_UPSTREAM_URL?.trim();
    const apiKey = process.env.SCRIPTURE_LICENSED_API_KEY?.trim();

    if (!url || !apiKey) {
      const stub = buildMockChapterPassage(book, chapter);
      return {
        ...stub,
        providerId: "licensed_niv",
        isPlaceholder: true,
        suppressOfflineBundle: true,
        attribution: {
          translationLabel: "NIV",
          detail:
            "TODO[NIV_LICENSE]: Set SCRIPTURE_LICENSED_UPSTREAM_URL + SCRIPTURE_LICENSED_API_KEY; do not log passage bodies.",
          requiresVisibleAttribution: true,
        },
      };
    }

    // TODO[NIV_LICENSE]: Implement licensed HTTP client using url + apiKey — never console.log verses.
    const pending = buildMockChapterPassage(book, chapter);
    const endpointReady = Boolean(url && apiKey);
    return {
      ...pending,
      providerId: "licensed_niv",
      isPlaceholder: true,
      suppressOfflineBundle: true,
      attribution: {
        translationLabel: "NIV",
        detail: endpointReady
          ? "TODO[NIV_LICENSE]: Upstream credentials present — HTTP client not implemented; placeholder verses only."
          : "TODO[NIV_LICENSE]: Upstream client not implemented — placeholder verses until HTTP integration ships.",
        requiresVisibleAttribution: true,
      },
    };
  }
}
