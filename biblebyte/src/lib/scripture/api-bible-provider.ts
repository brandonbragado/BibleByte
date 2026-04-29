import {
  type ApiBibleEnvelope,
  type ApiBibleListEnvelope,
  type Bible,
  type Book,
  type Chapter,
  type Passage,
  type SearchResponseData,
  ScriptureApiError,
} from "@/lib/scripture/types";
import { fetchApiBibleJson } from "@/lib/scripture/api-bible-http";
import { scriptureCacheKey, withScriptureCache } from "@/lib/scripture/cache";

/** TTL: catalogue data longer; chapter HTML shorter (NIV caching off by default in headers). */
const TTL_BIBLES = 3_600_000;
const TTL_BOOKS = 3_600_000;
const TTL_CHAPTER_LIST = 3_600_000;
const TTL_CHAPTER_BODY = 120_000;
const TTL_SEARCH = 60_000;

export async function listBibles(): Promise<Bible[]> {
  const cacheKey = scriptureCacheKey(["bibles"]);
  return withScriptureCache(cacheKey, TTL_BIBLES, async () => {
    const json = await fetchApiBibleJson<ApiBibleListEnvelope<Bible>>("/bibles");
    return json.data ?? [];
  });
}

export async function listBooks(bibleId: string): Promise<Book[]> {
  const cacheKey = scriptureCacheKey(["books", bibleId]);
  return withScriptureCache(cacheKey, TTL_BOOKS, async () => {
    const json = await fetchApiBibleJson<ApiBibleListEnvelope<Book>>(
      `/bibles/${encodeURIComponent(bibleId)}/books`
    );
    return json.data ?? [];
  });
}

export async function listChaptersForBook(bibleId: string, bookId: string): Promise<Chapter[]> {
  const cacheKey = scriptureCacheKey(["chapters", bibleId, bookId]);
  return withScriptureCache(cacheKey, TTL_CHAPTER_LIST, async () => {
    const json = await fetchApiBibleJson<ApiBibleListEnvelope<Chapter>>(
      `/bibles/${encodeURIComponent(bibleId)}/books/${encodeURIComponent(bookId)}/chapters`
    );
    return json.data ?? [];
  });
}

export async function getChapterById(bibleId: string, chapterId: string): Promise<Chapter> {
  const cacheKey = scriptureCacheKey(["chapter", bibleId, chapterId]);
  return withScriptureCache(cacheKey, TTL_CHAPTER_BODY, async () => {
    const json = await fetchApiBibleJson<ApiBibleEnvelope<Chapter>>(
      `/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}`
    );
    if (!json.data) {
      throw new ScriptureApiError("Empty chapter payload.", "empty_chapter", 502);
    }
    return json.data;
  });
}

export async function getPassage(bibleId: string, passageId: string): Promise<Passage> {
  const cacheKey = scriptureCacheKey(["passage", bibleId, passageId]);
  return withScriptureCache(cacheKey, TTL_CHAPTER_BODY, async () => {
    const json = await fetchApiBibleJson<ApiBibleEnvelope<Passage>>(
      `/bibles/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(passageId)}`
    );
    if (!json.data) {
      throw new ScriptureApiError("Empty passage payload.", "empty_passage", 502);
    }
    return json.data;
  });
}

export async function searchBible(
  bibleId: string,
  query: string,
  limit = "20"
): Promise<SearchResponseData> {
  const cacheKey = scriptureCacheKey(["search", bibleId, query, limit]);
  return withScriptureCache(cacheKey, TTL_SEARCH, async () => {
    const json = await fetchApiBibleJson<ApiBibleEnvelope<SearchResponseData>>(
      `/bibles/${encodeURIComponent(bibleId)}/search`,
      { query, limit }
    );
    return json.data ?? { verses: [] };
  });
}
