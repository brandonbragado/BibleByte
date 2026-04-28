import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { scriptureApiBibleModeGuard } from "@/lib/scripture/api-bible-mode-guard";
import { searchActiveBible } from "@/lib/scripture/scripture-service";
import type { SearchResult } from "@/lib/scripture/types";
import { ScriptureApiError } from "@/lib/scripture/types";

/** Proxies `GET /v1/bibles/{bibleId}/search?query=` — never logs full verse text. */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const modeBlock = scriptureApiBibleModeGuard();
  if (modeBlock) return modeBlock;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ error: "query_too_short", code: "invalid_query" }, { status: 400 });
  }

  try {
    const raw = await searchActiveBible(query);
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
