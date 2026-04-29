import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { scriptureApiBibleModeGuard } from "@/lib/scripture/api-bible-mode-guard";
import { sanitizeBibleId, clampSearchLimit, sanitizeSearchQuery } from "@/lib/scripture/sanitize";
import {
  resolveRequestedBibleId,
  searchScriptureForBible,
} from "@/lib/scripture/scripture-service";
import type { SearchResult } from "@/lib/scripture/types";
import { ScriptureApiError } from "@/lib/scripture/types";

/** Proxies NIV-only `GET /v1/bibles/{bibleId}/search?query=` — never logs full verse text. */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const modeBlock = scriptureApiBibleModeGuard();
  if (modeBlock) return modeBlock;

  const { searchParams } = new URL(req.url);
  const query = sanitizeSearchQuery(searchParams.get("query"));
  if (!query) {
    return NextResponse.json({ error: "query_too_short", code: "invalid_query" }, { status: 400 });
  }

  const rawBible = searchParams.get("bibleId");
  const bibleOverride = sanitizeBibleId(rawBible);
  if (rawBible?.trim() && !bibleOverride) {
    return NextResponse.json({ error: "invalid_bible_id", code: "invalid_query" }, { status: 400 });
  }

  const limit = clampSearchLimit(searchParams.get("limit"));

  try {
    const bibleId = resolveRequestedBibleId(bibleOverride);
    const raw = await searchScriptureForBible(bibleId, query, limit);
    const verses = raw.verses ?? [];
    const results: SearchResult[] = verses.map((v) => ({
      reference: v.reference,
      text: (v.text ?? "").slice(0, 500),
      verseId: v.id,
      id: v.id,
    }));

    console.info(
      JSON.stringify({
        event: "scripture_search",
        bibleId,
        total: raw.total ?? results.length,
        resultCount: results.length,
      })
    );

    return NextResponse.json(
      {
        data: {
          query: raw.query ?? query,
          total: raw.total ?? results.length,
          results,
        },
        bibleId,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
          "X-Scripture-Proxy": "search",
        },
      }
    );
  } catch (e) {
    if (e instanceof ScriptureApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "search_failed", code: "internal" }, { status: 500 });
  }
}
