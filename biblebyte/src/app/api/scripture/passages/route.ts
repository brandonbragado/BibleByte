import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { scriptureApiBibleModeGuard } from "@/lib/scripture/api-bible-mode-guard";
import { loadPassageReaderPayload } from "@/lib/scripture/scripture-service";
import { ScriptureApiError } from "@/lib/scripture/types";

/** Proxies `GET /v1/bibles/{bibleId}/passages/{passageId}` — returns parsed `verses` for the reader. */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const modeBlock = scriptureApiBibleModeGuard();
  if (modeBlock) return modeBlock;

  const { searchParams } = new URL(req.url);
  const passageId = searchParams.get("passageId")?.trim();
  if (!passageId) {
    return NextResponse.json({ error: "missing_passage_id", code: "invalid_query" }, { status: 400 });
  }

  try {
    const data = await loadPassageReaderPayload(passageId);
    return NextResponse.json(
      { data },
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
