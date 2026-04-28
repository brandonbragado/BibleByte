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
import { scriptureCacheKey, withScriptureCache } from "@/lib/scripture/cache";

const API_BIBLE_BASE =
  process.env.API_BIBLE_BASE_URL?.replace(/\/$/, "") ?? "https://api.scripture.api.bible/v1";

/** TTL: catalogue data longer; chapter HTML shorter (NIV caching off by default in headers). */
const TTL_BIBLES = 3_600_000;
const TTL_BOOKS = 3_600_000;
const TTL_CHAPTER_LIST = 3_600_000;
const TTL_CHAPTER_BODY = 120_000;
const TTL_SEARCH = 60_000;

function requireApiKey(): string {
  const key = process.env.API_BIBLE_KEY?.trim();
  if (!key) {
    throw new ScriptureApiError(
      "API.Bible is not configured (missing API_BIBLE_KEY).",
      "missing_api_key",
      503
    );
  }
  return key;
}

async function apiBibleFetch<T>(path: string, query?: Record<string, string>): Promise<T> {
  const key = requireApiKey();
  const url = new URL(`${API_BIBLE_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { "api-key": key },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      JSON.stringify({
        event: "api_bible_http_error",
        path: url.pathname,
        status: res.status,
        // never log full body (may contain scripture text)
        bodySnippet: body.slice(0, 120),
      })
    );
    let detail = `API.Bible request failed (${res.status}).`;
    if (res.status === 401) {
      try {
        const j = JSON.parse(body) as { message?: string };
        if (j?.message && typeof j.message === "string") {
          detail = `API.Bible: ${j.message}`;
        }
      } catch {
        /* ignore */
      }
    }
    throw new ScriptureApiError(detail, "upstream_error", res.status >= 500 ? 502 : res.status);
  }

  return res.json() as Promise<T>;
}

export async function listBibles(): Promise<Bible[]> {
  const cacheKey = scriptureCacheKey(["bibles"]);
  const env = await withScriptureCache(cacheKey, TTL_BIBLES, async () => {
    const json = await apiBibleFetch<ApiBibleListEnvelope<Bible>>("/bibles");
    return json.data ?? [];
  });
  return env;
}

export async function listBooks(bibleId: string): Promise<Book[]> {
  const cacheKey = scriptureCacheKey(["books", bibleId]);
  return withScriptureCache(cacheKey, TTL_BOOKS, async () => {
    const json = await apiBibleFetch<ApiBibleListEnvelope<Book>>(
      `/bibles/${encodeURIComponent(bibleId)}/books`
    );
    return json.data ?? [];
  });
}

export async function listChaptersForBook(bibleId: string, bookId: string): Promise<Chapter[]> {
  const cacheKey = scriptureCacheKey(["chapters", bibleId, bookId]);
  return withScriptureCache(cacheKey, TTL_CHAPTER_LIST, async () => {
    const json = await apiBibleFetch<ApiBibleListEnvelope<Chapter>>(
      `/bibles/${encodeURIComponent(bibleId)}/books/${encodeURIComponent(bookId)}/chapters`
    );
    return json.data ?? [];
  });
}

export async function getChapterById(bibleId: string, chapterId: string): Promise<Chapter> {
  const cacheKey = scriptureCacheKey(["chapter", bibleId, chapterId]);
  return withScriptureCache(cacheKey, TTL_CHAPTER_BODY, async () => {
    const json = await apiBibleFetch<ApiBibleEnvelope<Chapter>>(
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
    const json = await apiBibleFetch<ApiBibleEnvelope<Passage>>(
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
    const json = await apiBibleFetch<ApiBibleEnvelope<SearchResponseData>>(
      `/bibles/${encodeURIComponent(bibleId)}/search`,
      { query, limit }
    );
    return json.data ?? { verses: [] };
  });
}
