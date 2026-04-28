import { NextResponse } from "next/server";
import { z } from "zod";

import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  platform: z.enum(["ios", "android", "web"]),
  device_token: z.string().min(8).max(4096),
});

/**
 * Registers/replaces a device token for remote reminders (critical action item #3).
 * TODO[APNs_FCM]: Call from Expo after obtaining native push permission + token.
 */
export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "push_register");
  if (limited) return limited;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("push_devices").upsert(
    {
      user_id: user.id,
      platform: parsed.platform,
      device_token: parsed.device_token,
      updated_at: now,
    },
    { onConflict: "user_id,platform" }
  );

  if (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "persist_failed",
        hint:
          error.code === "42P01"
            ? "Run migration 005 for push_devices."
            : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
