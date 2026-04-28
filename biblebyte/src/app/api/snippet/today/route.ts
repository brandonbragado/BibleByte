import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { allowsLicensedCopyrightOnSurface } from "@/config/scripture";
import { utcTodayIsoDate } from "@/lib/date/utc-date";
import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { createPublicAnonClient } from "@/lib/supabase/public-anon";
import { applyWidgetSnippetPolicy } from "@/lib/scripture/snippet-policy";

/**
 * Public JSON payload for widgets / Expo snippet surfaces (placeholder scripture only).
 * TODO[NIV_LICENSE]: Serve licensed excerpt once publisher workflow clears.
 */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "snippet");
  if (limited) return limited;

  const reqId = randomUUID();
  const jsonHeaders = (extra?: Record<string, string>) => ({
    "X-Request-Id": reqId,
    ...extra,
  });

  const verseDate = utcTodayIsoDate();

  try {
    const supabase = createPublicAnonClient();
    const { data, error } = await supabase
      .from("daily_verses")
      .select("verse_date, reference, body_placeholder, attribution_note")
      .eq("verse_date", verseDate)
      .maybeSingle();

    if (error) {
      console.error(JSON.stringify({ event: "snippet_supabase_error", request_id: reqId, message: error.message }));
      return NextResponse.json(
        { error: "snippet_load_failed", verse_date: verseDate, request_id: reqId },
        { status: 503, headers: jsonHeaders() }
      );
    }

    if (!data?.reference || !data.body_placeholder) {
      return NextResponse.json(
        {
          verse_date: verseDate,
          reference: null,
          body_placeholder: null,
          attribution_note: null,
          hint: "Seed daily_verses via migration 004.",
          request_id: reqId,
        },
        {
          status: 404,
          headers: jsonHeaders({
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          }),
        }
      );
    }

    const payload = applyWidgetSnippetPolicy({
      verse_date: data.verse_date,
      reference: data.reference,
      body_placeholder: data.body_placeholder,
      attribution_note: data.attribution_note,
    });

    const cache =
      allowsLicensedCopyrightOnSurface("widget") && payload.scripture_policy.licensed_text === "allowed"
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "public, s-maxage=300, stale-while-revalidate=600";

    return NextResponse.json(payload, {
      headers: jsonHeaders({
        "Cache-Control": cache,
        "X-Scripture-Surface": "widget",
      }),
    });
  } catch (e) {
    console.error(JSON.stringify({ event: "snippet_fatal", request_id: reqId, error: String(e) }));
    return NextResponse.json(
      { error: "server_misconfigured", request_id: reqId },
      { status: 500, headers: jsonHeaders() }
    );
  }
}
