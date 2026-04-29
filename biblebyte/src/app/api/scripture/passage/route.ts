import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { scriptureApiBibleModeGuard } from "@/lib/scripture/api-bible-mode-guard";
import { sanitizeBibleId, sanitizePassageId } from "@/lib/scripture/sanitize";
import { getActiveBibleId, loadPassageReaderPayloadForBible } from "@/lib/scripture/scripture-service";
import { ScriptureApiError } from "@/lib/scripture/types";

/**
 * `GET /api/scripture/passage?bibleId=&passageId=` — explicit Bible edition + passage id.
 * When `bibleId` is omitted, uses the active edition from env (same as `/passages`).
 */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const modeBlock = scriptureApiBibleModeGuard();
  if (modeBlock) return modeBlock;

  const { searchParams } = new URL(req.url);
  const passageParam = sanitizePassageId(searchParams.get("passageId"));
  if (!passageParam) {
    return NextResponse.json({ error: "invalid_passage_id", code: "invalid_query" }, { status: 400 });
  }

  const rawBible = searchParams.get("bibleId");
  const bibleParam = sanitizeBibleId(rawBible);
  if (rawBible?.trim() && !bibleParam) {
    return NextResponse.json({ error: "invalid_bible_id", code: "invalid_query" }, { status: 400 });
  }

  let bibleId: string;
  try {
    bibleId = bibleParam ?? getActiveBibleId();
  } catch (e) {
    if (e instanceof ScriptureApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    throw e;
  }

  try {
    const data = await loadPassageReaderPayloadForBible(bibleId, passageParam);
    return NextResponse.json(
      { data, bibleId },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Scripture-Proxy": "passage",
        },
      }
    );
  } catch (e) {
    if (e instanceof ScriptureApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "passage_failed", code: "internal" }, { status: 500 });
  }
}
