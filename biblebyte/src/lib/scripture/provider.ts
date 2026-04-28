import {
  allowsLicensedCopyrightOnSurface,
  getScriptureProviderMode,
  isNivScriptureLicenseApproved,
} from "@/config/scripture";
import { getBookByCode } from "@/lib/bible/canon";
import { LicensedNivScriptureProvider } from "@/lib/scripture/licensed-provider";
import { buildMockChapterPassage, MockScriptureProvider } from "@/lib/scripture/mock-provider";
import { PublicDomainScriptureProvider } from "@/lib/scripture/public-domain-provider";
import {
  ApiBibleScriptureProvider,
  getActiveBibleId,
} from "@/lib/scripture/scripture-service";
import type { ChapterPassage, ScriptureProvider, ScriptureSurface } from "@/lib/scripture/types";

let singleton: ScriptureProvider | null = null;

export function createScriptureProvider(): ScriptureProvider {
  const mode = getScriptureProviderMode();
  switch (mode) {
    case "api_bible":
      return new ApiBibleScriptureProvider();
    case "public_domain":
      return new PublicDomainScriptureProvider();
    case "licensed_niv":
      return new LicensedNivScriptureProvider();
    default:
      return new MockScriptureProvider();
  }
}

export function getScriptureProvider(): ScriptureProvider {
  if (!singleton) {
    singleton = createScriptureProvider();
  }
  return singleton;
}

export type ScriptureUsageLog = {
  event: "scripture_provider_request";
  provider: string;
  bookCode: string;
  chapter: number;
  verseCount: number;
  surface: ScriptureSurface;
  durationMs: number;
  isPlaceholder: boolean;
};

/** Logs request metadata only — never passage text. */
export function logScriptureUsage(meta: Omit<ScriptureUsageLog, "event">): void {
  const payload: ScriptureUsageLog = {
    event: "scripture_provider_request",
    ...meta,
  };
  console.info(JSON.stringify(payload));
}

/**
 * Loads a chapter for a UI/API surface, applies copyright surface policy, logs safely.
 */
export async function fetchChapterForSurface(
  bookCode: string,
  chapter: number,
  surface: ScriptureSurface
): Promise<ChapterPassage> {
  const t0 = Date.now();
  const provider = getScriptureProvider();
  let passage = await provider.getChapter(bookCode, chapter);

  let nivEditionWithoutLicense = false;
  if (provider.id === "api_bible") {
    try {
      const active = getActiveBibleId();
      const nivId = process.env.API_BIBLE_NIV_BIBLE_ID?.trim();
      nivEditionWithoutLicense = Boolean(
        nivId && nivId === active && !isNivScriptureLicenseApproved()
      );
    } catch {
      nivEditionWithoutLicense = false;
    }
  }

  const mustRedact =
    nivEditionWithoutLicense ||
    (!passage.isPlaceholder &&
      !allowsLicensedCopyrightOnSurface(surface) &&
      provider.id !== "api_bible");

  if (mustRedact) {
    const book = getBookByCode(bookCode);
    if (book) {
      const redacted = buildMockChapterPassage(book, chapter);
      passage = {
        ...redacted,
        providerId: provider.id,
        isPlaceholder: true,
        suppressOfflineBundle: true,
        attribution: {
          ...redacted.attribution,
          detail: nivEditionWithoutLicense
            ? "NIV edition requires NIV_SCRIPTURE_LICENSE_APPROVED — placeholder only. TODO[NIV_LICENSE]."
            : "Licensed text withheld on this surface by policy — placeholder copy shown. TODO[NIV_LICENSE]: review surface flags.",
        },
      };
    }
  }

  logScriptureUsage({
    provider: passage.providerId,
    bookCode: passage.bookCode,
    chapter: passage.chapter,
    verseCount: passage.verses.length,
    surface,
    durationMs: Date.now() - t0,
    isPlaceholder: passage.isPlaceholder,
  });

  return passage;
}
