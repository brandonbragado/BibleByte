import { NextResponse } from "next/server";

import { isApiBibleScriptureMode } from "@/config/scripture";

const MESSAGE =
  "This endpoint requires SCRIPTURE_PROVIDER_MODE=api_bible (and API_BIBLE_KEY). Chapter reads use GET /api/scripture/chapters for all provider modes.";

/** Returns a JSON error response when scripture mode is not `api_bible`; otherwise `null`. */
export function scriptureApiBibleModeGuard(): NextResponse | null {
  if (!isApiBibleScriptureMode()) {
    return NextResponse.json({ error: MESSAGE, code: "scripture_mode_required" }, { status: 503 });
  }
  return null;
}
