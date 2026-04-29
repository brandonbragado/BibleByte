import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { scriptureApiBibleModeGuard } from "@/lib/scripture/api-bible-mode-guard";
import { sanitizeBibleId, sanitizePassageId } from "@/lib/scripture/sanitize";
import {
  loadPassageReaderPayloadForBible,
  resolveRequestedBibleId,
} from "@/lib/scripture/scripture-service";
import { ScriptureApiError } from "@/lib/scripture/types";

/**
 * Proxies `GET /v1/bibles/{bibleId}/passages/{passageId}` — returns parsed `verses` for the reader.
 * Optional `bibleId` must match the active NIV edition; prefer `/api/scripture/passage` for explicit ids.
 */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const modeBlock = scriptureApiBibleModeGuard();
  if (modeBlock) return modeBlock;

  const { searchParams } = new URL(req.url);
  const passageParam = sanitizePassageId(searchParams.get("passageId"));
  if (!passageParam) {
    return NextResponse.json(
      { error: "missing_or_invalid_passage_id", code: "invalid_query" },
      { status: 400 }
    );
  }

  const rawBible = searchParams.get("bibleId");
  const bibleOverride = sanitizeBibleId(rawBible);
  if (rawBible?.trim() && !bibleOverride) {
    return NextResponse.json({ error: "invalid_bible_id", code: "invalid_query" }, { status: 400 });
  }

  try {
    const bibleId = resolveRequestedBibleId(bibleOverride);
    const data = await loadPassageReaderPayloadForBible(bibleId, passageParam);
    return NextResponse.json(
      { data, bibleId },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Scripture-Proxy": "passages",
        },
      }
    );
  } catch (e) {
    if (e instanceof ScriptureApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "passages_failed", code: "internal" }, { status: 500 });
  }
}
