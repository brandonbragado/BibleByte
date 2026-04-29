import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_NAMES = new Set([
  "onboarding_started",
  "onboarding_completed",
  "reflection_saved",
  "snippet_viewed",
  "notification_opened",
  "lesson_started",
  "lesson_completed",
  "streak_updated",
]);

export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "analytics");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { name?: unknown }).name !== "string"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = (body as { name: string }).name.trim();
  const payload =
    typeof (body as { payload?: unknown }).payload === "object" &&
    (body as { payload?: unknown }).payload !== null
      ? ((body as { payload: Record<string, unknown> }).payload as Record<string, unknown>)
      : {};

  if (!name || name.length > 120 || !ALLOWED_NAMES.has(name)) {
    return NextResponse.json({ error: "unsupported_event" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("analytics_opt_in")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.analytics_opt_in) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { error } = await supabase.from("analytics_events").insert({
    user_id: user.id,
    name,
    payload,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
