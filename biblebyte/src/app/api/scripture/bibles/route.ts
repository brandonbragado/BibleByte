import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { scriptureApiBibleModeGuard } from "@/lib/scripture/api-bible-mode-guard";
import { getActiveBibleId, loadBiblesCatalog } from "@/lib/scripture/scripture-service";
import { ScriptureApiError } from "@/lib/scripture/types";

/** Proxies API.Bible `GET /v1/bibles` — API key stays server-side; only when `SCRIPTURE_PROVIDER_MODE=api_bible`. */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "scripture");
  if (limited) return limited;

  const modeBlock = scriptureApiBibleModeGuard();
  if (modeBlock) return modeBlock;

  try {
    const data = await loadBiblesCatalog();
    let activeBibleId: string | null = null;
    try {
      activeBibleId = getActiveBibleId();
    } catch {
      activeBibleId = null;
    }
    return NextResponse.json(
      { data, activeBibleId },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
          "X-Scripture-Proxy": "bibles",
        },
      }
    );
  } catch (e) {
    if (e instanceof ScriptureApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "bibles_failed", code: "internal" }, { status: 500 });
  }
}
