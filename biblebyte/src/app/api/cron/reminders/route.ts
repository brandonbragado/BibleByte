import { NextResponse } from "next/server";

import { utcMinuteMatchesReminderWallTime } from "@/lib/reminders/match-wall-time";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron hook — authenticated via `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this when CRON_SECRET is set).
 *
 * Resolves who should receive a reminder **this UTC minute** (naive wall-clock vs UTC —
 * replace with user TZ once Expo ships `Intl`/IANA selection).
 *
 * TODO[APNs_FCM]: Iterate `push_targets`, send via FCM/APNs — never log raw tokens at info level.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      {
        error: "admin_client_unconfigured",
        hint: "Set SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 }
    );
  }

  const nowUtc = new Date();

  const { data: profiles, error: profilesError } = await admin
    .from("user_profiles")
    .select("id, reminder_wall_time")
    .eq("reminder_enabled", true)
    .not("reminder_wall_time", "is", null);

  if (profilesError) {
    console.error(profilesError);
    return NextResponse.json({ error: "profiles_query_failed" }, { status: 500 });
  }

  const eligible =
    profiles?.filter((p) => utcMinuteMatchesReminderWallTime(p.reminder_wall_time, nowUtc)) ?? [];

  const MAX_ELIGIBLE_WARN = 2000;
  if (eligible.length > MAX_ELIGIBLE_WARN) {
    console.warn(
      JSON.stringify({
        event: "cron_reminders_large_eligible_set",
        eligible_count: eligible.length,
        cap: MAX_ELIGIBLE_WARN,
        hint: "Consider batching or TZ-aware scheduling before scaling sends.",
      })
    );
  }

  const userIds = eligible.map((p) => p.id);

  let pushRowCount = 0;
  if (userIds.length > 0) {
    const { data: devices, error: devErr } = await admin
      .from("push_devices")
      .select("user_id, platform")
      .in("user_id", userIds);

    if (devErr) {
      console.error(devErr);
      return NextResponse.json({ error: "push_devices_query_failed" }, { status: 500 });
    }
    pushRowCount = devices?.length ?? 0;
  }

  return NextResponse.json({
    ok: true,
    utc_iso: nowUtc.toISOString(),
    eligible_profiles: eligible.length,
    push_targets: pushRowCount,
    dispatched: 0,
    todo_apns_fcm:
      "Resolve recipients server-side — next step is enqueue + send via FCM/APNs without logging tokens.",
  });
}
