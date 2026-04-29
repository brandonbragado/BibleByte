import { NextResponse } from "next/server";

import {
  apiBiblePlaceholderOnUpstreamError,
  getScriptureProviderMode,
} from "@/config/scripture";
import { getBookByCode } from "@/lib/bible/canon";
import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { buildMockChapterPassage } from "@/lib/scripture/mock-provider";
import { fetchChapterForSurface } from "@/lib/scripture/provider";
import { loadChapterFromApiBible } from "@/lib/scripture/scripture-service";
import {
  type ChapterPassage,
  ScriptureApiError,
  type ScriptureChapterPayload,
} from "@/lib/scripture/types";

function toPayload(passage: ChapterPassage): ScriptureChapterPayload {
  return {
    bookCode: passage.bookCode,
    bookName: passage.bookName,
    chapter: passage.chapter,
    verses: passage.verses,
    attribution: passage.attribution,
    providerId: passage.providerId,
    isPlaceholder: passage.isPlaceholder,
    suppressOfflineBundle: passage.suppressOfflineBundle,
  };
}

function recoverableApiBibleFailure(e: ScriptureApiError): boolean {
  return (
    e.status === 401 ||
    e.status === 403 ||
    e.status === 429 ||
    e.status === 502 ||
    e.status === 503 ||
    e.status === 504 ||
    e.code === "missing_api_key" ||
    e.code === "upstream_error" ||
    e.code === "upstream_timeout" ||
    e.code === "upstream_rate_limited"
  );
}

/**
 * Chapter reader JSON — `book` = canon code (e.g. GEN), `chapter` = integer.
 * Uses API.Bible when `SCRIPTURE_PROVIDER_MODE=api_bible`, else legacy providers.
 */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const bookRaw = searchParams.get("book")?.trim() ?? "";
  const chapterRaw = searchParams.get("chapter")?.trim() ?? "";
  const chapter = Number.parseInt(chapterRaw, 10);

  if (!bookRaw || Number.isNaN(chapter)) {
    return NextResponse.json({ error: "invalid_query", code: "invalid_query" }, { status: 400 });
  }

  const meta = getBookByCode(bookRaw);
  if (!meta || chapter < 1 || chapter > meta.chapters) {
    return NextResponse.json({ error: "not_found", code: "not_found" }, { status: 404 });
  }

  try {
    const mode = getScriptureProviderMode();
    if (mode === "api_bible") {
      try {
        const body = await loadChapterFromApiBible(meta.code, chapter);
        return NextResponse.json(body, {
          headers: {
            "Cache-Control": "private, no-store",
            "X-Scripture-Provider": "api_bible",
          },
        });
      } catch (e) {
        if (
          apiBiblePlaceholderOnUpstreamError() &&
          e instanceof ScriptureApiError &&
          recoverableApiBibleFailure(e)
        ) {
          const passage = buildMockChapterPassage(meta, chapter);
          const body: ScriptureChapterPayload = {
            ...toPayload(passage),
            upstreamFallback: true,
            upstreamFallbackNote:
              "API.Bible request failed — showing mock placeholder. Set a valid API_BIBLE_KEY or disable API_BIBLE_PLACEHOLDER_ON_UPSTREAM_ERROR.",
            attribution: {
              ...passage.attribution,
              detail: `${passage.attribution.detail} · API.Bible: ${e.message} (code ${e.code}).`,
            },
          };
          return NextResponse.json(body, {
            headers: {
              "Cache-Control": "private, no-store",
              "X-Scripture-Provider": "mock",
              "X-BibleByte-Upstream-Fallback": "1",
            },
          });
        }
        throw e;
      }
    }

    const passage = await fetchChapterForSurface(meta.code, chapter, "api");
    return NextResponse.json(toPayload(passage), {
      headers: {
        "Cache-Control": "private, max-age=60",
        "X-Scripture-Provider": passage.providerId,
      },
    });
  } catch (e) {
    if (e instanceof ScriptureApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "chapters_failed", code: "internal" }, { status: 500 });
  }
}
