import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { scriptureApiBibleModeGuard } from "@/lib/scripture/api-bible-mode-guard";
import { sanitizeBibleId } from "@/lib/scripture/sanitize";
import { loadBooksForBible, resolveRequestedBibleId } from "@/lib/scripture/scripture-service";
import { ScriptureApiError } from "@/lib/scripture/types";

/** Proxies NIV-only `GET /v1/bibles/{bibleId}/books`; optional `bibleId` must match active NIV id. */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const modeBlock = scriptureApiBibleModeGuard();
  if (modeBlock) return modeBlock;

  const { searchParams } = new URL(req.url);
  const rawBible = searchParams.get("bibleId");
  const sanitized = sanitizeBibleId(rawBible);
  if (rawBible?.trim() && !sanitized) {
    return NextResponse.json({ error: "invalid_bible_id", code: "invalid_query" }, { status: 400 });
  }

  try {
    const bibleId = resolveRequestedBibleId(sanitized);
    const data = await loadBooksForBible(bibleId);
    return NextResponse.json(
      { data, bibleId },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
          "X-Scripture-Proxy": "books",
        },
      }
    );
  } catch (e) {
    if (e instanceof ScriptureApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "books_failed", code: "internal" }, { status: 500 });
  }
}
