"use server";

import { revalidatePath } from "next/cache";

import { instrumentAnalyticsEvent } from "@/lib/analytics/server";
import { utcTodayIsoDate } from "@/lib/date/utc-date";
import { createClient } from "@/lib/supabase/server";

const MAX_LEN = 4000;

export type SaveReflectionResult =
  | { ok: true; cleared?: boolean }
  | { ok: false; error: string };

export async function saveTodayReflection(rawBody: string): Promise<SaveReflectionResult> {
  const body = rawBody.trim();
  if (body.length > MAX_LEN) {
    return { ok: false, error: `Reflection must be ${MAX_LEN} characters or fewer.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const entryDate = utcTodayIsoDate();

  if (!body) {
    const { error } = await supabase
      .from("daily_reflections")
      .delete()
      .eq("user_id", user.id)
      .eq("entry_date", entryDate);

    if (error) {
      console.error(error);
      return { ok: false, error: "Could not clear reflection." };
    }
    revalidatePath("/journal");
    return { ok: true, cleared: true };
  }

  const { error } = await supabase.from("daily_reflections").upsert(
    {
      user_id: user.id,
      entry_date: entryDate,
      body,
    },
    { onConflict: "user_id,entry_date" }
  );

  if (error) {
    console.error(error);
    return {
      ok: false,
      error:
        error.message.includes("daily_reflections_user_entry_unique") ||
        error.message.includes("duplicate key")
          ? "Database needs migration 002 (unique daily reflection). Run supabase/migrations/002_daily_reflections_entry_date.sql."
          : "Could not save reflection.",
    };
  }

  await instrumentAnalyticsEvent("reflection_saved", { entry_date: entryDate });

  revalidatePath("/journal");
  return { ok: true };
}
