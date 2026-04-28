import {
  allowOfflineBundles,
  isNivScriptureLicenseApproved,
  SCRIPTURE_DEFAULT_ATTRIBUTION,
  SCRIPTURE_TRANSLATION_LABEL,
} from "@/config/scripture";
import type { BibleBookMeta } from "@/lib/bible/canon";
import { getBookByCode } from "@/lib/bible/canon";
import {
  getChapterById,
  getPassage,
  listBooks,
  listChaptersForBook,
  listBibles,
  searchBible,
} from "@/lib/scripture/api-bible-provider";
import type {
  Bible,
  Book,
  ChapterPassage,
  ScriptureChapterPayload,
  ScripturePassagePayload,
  SearchResponseData,
  ScriptureProvider,
  VerseLine,
} from "@/lib/scripture/types";
import { ScriptureApiError } from "@/lib/scripture/types";

/** Resolve bible id: NIV only when legally approved + env set; else default translation id. */
export function getActiveBibleId(): string {
  const niv = process.env.API_BIBLE_NIV_BIBLE_ID?.trim();
  const def = process.env.API_BIBLE_DEFAULT_BIBLE_ID?.trim();

  if (isNivScriptureLicenseApproved() && niv) {
    return niv;
  }

  if (!def) {
    throw new ScriptureApiError(
      "Set API_BIBLE_DEFAULT_BIBLE_ID (and API_BIBLE_NIV_BIBLE_ID when NIV is cleared).",
      "missing_bible_id",
      503
    );
  }

  if (niv && def === niv && !isNivScriptureLicenseApproved()) {
    throw new ScriptureApiError(
      "Default Bible id matches API_BIBLE_NIV_BIBLE_ID but NIV_SCRIPTURE_LICENSE_APPROVED is false.",
      "niv_not_licensed",
      503
    );
  }

  return def;
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse API.Bible chapter HTML into verse lines — never log raw HTML at info level. */
export function parseVersesFromChapterHtml(html: string): VerseLine[] {
  if (!html?.trim()) return [];
  const verses: VerseLine[] = [];

  const dataNum = /data-number="(\d+)"[^>]*>([\s\S]*?)(?=data-number="|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = dataNum.exec(html)) !== null) {
    const n = Number.parseInt(m[1], 10);
    const text = stripTags(m[2] ?? "").trim();
    if (Number.isFinite(n) && text) verses.push({ verseNumber: n, text });
  }
  if (verses.length) {
    return verses.sort((a, b) => a.verseNumber - b.verseNumber);
  }

  const sup = /<sup[^>]*>(\d+)<\/sup>\s*([\s\S]*?)(?=<sup[^>]*>|$)/gi;
  while ((m = sup.exec(html)) !== null) {
    const n = Number.parseInt(m[1], 10);
    const text = stripTags(m[2] ?? "").trim();
    if (Number.isFinite(n) && text) verses.push({ verseNumber: n, text });
  }
  if (verses.length) {
    return verses.sort((a, b) => a.verseNumber - b.verseNumber);
  }

  const span =
    /<span[^>]*data-usfm="[^"]*\.(\d+)"[^>]*>([\s\S]*?)<\/span>/gi;
  while ((m = span.exec(html)) !== null) {
    const n = Number.parseInt(m[1], 10);
    const text = stripTags(m[2] ?? "").trim();
    if (Number.isFinite(n) && text) verses.push({ verseNumber: n, text });
  }
  if (verses.length) {
    return verses.sort((a, b) => a.verseNumber - b.verseNumber);
  }

  const flat = stripTags(html);
  if (flat) return [{ verseNumber: 1, text: flat }];
  return [];
}

function matchApiBook(books: Book[], canon: BibleBookMeta): Book | undefined {
  const code = canon.code.toUpperCase();
  return books.find(
    (b) =>
      b.abbreviation?.toUpperCase() === code ||
      b.abbreviation?.toUpperCase().replace(/\s+/g, "") === code ||
      b.name?.toUpperCase() === canon.name.toUpperCase()
  );
}

async function resolveApiChapter(
  bibleId: string,
  canon: BibleBookMeta,
  chapterNum: number
): Promise<{ verses: VerseLine[]; reference?: string; copyright?: string }> {
  const books = await listBooks(bibleId);
  const book = matchApiBook(books, canon);
  if (!book) {
    throw new ScriptureApiError(
      `Book not found in this Bible edition: ${canon.code}`,
      "book_not_found",
      404
    );
  }

  const chapters = await listChaptersForBook(bibleId, book.id);
  const ch = chapters.find((c) => String(c.number) === String(chapterNum));
  if (!ch) {
    throw new ScriptureApiError(
      `Chapter ${chapterNum} not found for ${canon.name}.`,
      "chapter_not_found",
      404
    );
  }

  const full = await getChapterById(bibleId, ch.id);
  let verses = parseVersesFromChapterHtml(full.content ?? "");

  if (!verses.length && full.reference) {
    try {
      const passage = await getPassage(bibleId, `${canon.code}.${chapterNum}`);
      verses = parseVersesFromChapterHtml(passage.content ?? "");
    } catch {
      /* fall through */
    }
  }

  return {
    verses,
    reference: full.reference ?? ch.reference,
    copyright: full.copyright,
  };
}

export async function loadChapterFromApiBible(
  bookCode: string,
  chapterNum: number
): Promise<ScriptureChapterPayload> {
  const canon = getBookByCode(bookCode);
  if (!canon || chapterNum < 1 || chapterNum > canon.chapters) {
    throw new ScriptureApiError("Invalid book or chapter.", "invalid_params", 400);
  }

  const bibleId = getActiveBibleId();
  const bibles = await listBibles();
  const bibleMeta = bibles.find((b) => b.id === bibleId);
  const { verses, reference, copyright } = await resolveApiChapter(bibleId, canon, chapterNum);

  const usingNiv =
    isNivScriptureLicenseApproved() &&
    process.env.API_BIBLE_NIV_BIBLE_ID?.trim() === bibleId;

  const detailParts = [
    bibleMeta?.name ?? "API.Bible",
    copyright?.trim() || undefined,
    usingNiv
      ? "NIV enabled per license flags — honor API.Bible & publisher terms."
      : "Translation via API.Bible — not NIV unless NIV license + API_BIBLE_NIV_BIBLE_ID active.",
    SCRIPTURE_DEFAULT_ATTRIBUTION,
  ].filter(Boolean);

  return {
    bookCode: canon.code,
    bookName: canon.name,
    chapter: chapterNum,
    verses,
    providerId: "api_bible",
    isPlaceholder: verses.length === 0,
    suppressOfflineBundle: !allowOfflineBundles(),
    reference,
    attribution: {
      translationLabel: bibleMeta?.abbreviation ?? bibleMeta?.name ?? SCRIPTURE_TRANSLATION_LABEL,
      detail: detailParts.join(" · "),
      requiresVisibleAttribution: true,
    },
  };
}

export async function searchActiveBible(query: string): Promise<SearchResponseData> {
  const bibleId = getActiveBibleId();
  return searchBible(bibleId, query);
}

export async function loadPassageFromApiBible(passageId: string) {
  const bibleId = getActiveBibleId();
  return getPassage(bibleId, passageId);
}

/** Passage JSON for the reader — parses HTML into verses like chapter loads. */
export async function loadPassageReaderPayload(passageId: string): Promise<ScripturePassagePayload> {
  const trimmed = passageId.trim();
  if (!trimmed) {
    throw new ScriptureApiError("Missing passage id.", "invalid_params", 400);
  }

  const passage = await loadPassageFromApiBible(trimmed);
  const verses = parseVersesFromChapterHtml(passage.content ?? "");
  const bibleId = getActiveBibleId();
  const bibles = await listBibles();
  const bibleMeta = bibles.find((b) => b.id === bibleId);

  const usingNiv =
    isNivScriptureLicenseApproved() &&
    process.env.API_BIBLE_NIV_BIBLE_ID?.trim() === bibleId;

  const detailParts = [
    bibleMeta?.name ?? "API.Bible",
    passage.copyright?.trim() || undefined,
    usingNiv
      ? "NIV enabled per license flags — honor API.Bible & publisher terms."
      : "Translation via API.Bible — not NIV unless NIV license + API_BIBLE_NIV_BIBLE_ID active.",
    SCRIPTURE_DEFAULT_ATTRIBUTION,
  ].filter(Boolean);

  return {
    passageId: passage.id,
    reference: passage.reference,
    verses,
    providerId: "api_bible",
    isPlaceholder: verses.length === 0,
    suppressOfflineBundle: !allowOfflineBundles(),
    copyright: passage.copyright,
    attribution: {
      translationLabel: bibleMeta?.abbreviation ?? bibleMeta?.name ?? SCRIPTURE_TRANSLATION_LABEL,
      detail: detailParts.join(" · "),
      requiresVisibleAttribution: true,
    },
  };
}

export async function loadBiblesCatalog(): Promise<Bible[]> {
  return listBibles();
}

export async function loadBooksForBible(bibleId: string): Promise<Book[]> {
  return listBooks(bibleId);
}

export async function loadChaptersForBook(bibleId: string, bookId: string) {
  return listChaptersForBook(bibleId, bookId);
}

/**
 * Implements legacy `ScriptureProvider` bridge so `provider.ts` can delegate chapter reads to API.Bible.
 */
export class ApiBibleScriptureProvider implements ScriptureProvider {
  readonly id = "api_bible" as const;

  async getChapter(bookCode: string, chapter: number): Promise<ChapterPassage> {
    const json = await loadChapterFromApiBible(bookCode, chapter);
    return {
      bookCode: json.bookCode,
      bookName: json.bookName,
      chapter: json.chapter,
      verses: json.verses,
      attribution: json.attribution,
      providerId: "api_bible",
      isPlaceholder: json.isPlaceholder,
      suppressOfflineBundle: json.suppressOfflineBundle,
    };
  }
}
