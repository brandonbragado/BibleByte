"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { instrumentAnalyticsEvent } from "@/lib/analytics/server";
import { monthGrid } from "@/lib/prayer-rhythm/dates";
import { computeBestStreakWithGrace, computeStreakWithGrace, nextMilestoneToCelebrate } from "@/lib/prayer-rhythm/streak";
import { createClient } from "@/lib/supabase/server";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ym = z.string().regex(/^\d{4}-\d{2}$/);

export type PrayerCheckInDto = {
  local_date: string;
  logged_at: string;
  note: string | null;
};

export type PrayerRhythmStateDto = {
  localToday: string;
  monthYm: string;
  checkIns: PrayerCheckInDto[];
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  todayChecked: boolean;
  celebratedMilestone: number;
};

export async function loadPrayerRhythmState(input: {
  localToday: string;
  monthYm: string;
}): Promise<PrayerRhythmStateDto | { error: string }> {
  const todayParsed = ymd.safeParse(input.localToday);
  const monthParsed = ym.safeParse(input.monthYm);
  if (!todayParsed.success || !monthParsed.success) {
    return { error: "Invalid date format." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .select("prayer_milestone_celebrated")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    console.error(profileErr);
    return { error: "Could not load profile." };
  }

  const celebratedRaw = profile?.prayer_milestone_celebrated;
  const celebratedMilestone =
    typeof celebratedRaw === "number" && [0, 7, 14, 30, 90].includes(celebratedRaw)
      ? celebratedRaw
      : 0;

  const [yStr, mStr] = input.monthYm.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const gridWeeks = monthGrid(y, m);
  const flat = gridWeeks.flat();
  const sortedYmds = flat.map((c) => c.ymd).sort();
  const start = sortedYmds[0]!;
  const end = sortedYmds[sortedYmds.length - 1]!;

  const { data: rows, error } = await supabase
    .from("prayer_check_ins")
    .select("local_date, logged_at, note")
    .eq("user_id", user.id)
    .gte("local_date", start)
    .lte("local_date", end)
    .order("local_date", { ascending: true });

  if (error) {
    console.error(error);
    return error.code === "42P01"
      ? { error: "Run migration 009 in Supabase for prayer_check_ins." }
      : { error: "Could not load check-ins." };
  }

  const { data: allDates, error: allErr } = await supabase
    .from("prayer_check_ins")
    .select("local_date")
    .eq("user_id", user.id);

  if (allErr) {
    console.error(allErr);
    return { error: "Could not load rhythm history." };
  }

  const set = new Set((allDates ?? []).map((r) => String(r.local_date).slice(0, 10)));
  const sorted = [...set].sort();

  const checkIns: PrayerCheckInDto[] = (rows ?? []).map((r) => ({
    local_date: String(r.local_date).slice(0, 10),
    logged_at: String(r.logged_at),
    note: r.note ? String(r.note) : null,
  }));

  return {
    localToday: todayParsed.data,
    monthYm: monthParsed.data,
    checkIns,
    currentStreak: computeStreakWithGrace(set, todayParsed.data),
    bestStreak: computeBestStreakWithGrace(sorted),
    totalDays: set.size,
    todayChecked: set.has(todayParsed.data),
    celebratedMilestone,
  };
}

export async function markPrayerToday(input: {
  localToday: string;
  note?: string | null;
}): Promise<
  | {
      ok: true;
      milestone: 7 | 14 | 30 | 90 | null;
      celebratedMilestone: number;
    }
  | { error: string }
> {
  const parsed = ymd.safeParse(input.localToday);
  if (!parsed.success) return { error: "Invalid date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .select("prayer_milestone_celebrated")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    console.error(profileErr);
    return { error: "Could not load profile." };
  }

  const celebratedRaw = profile?.prayer_milestone_celebrated;
  let celebratedMilestone =
    typeof celebratedRaw === "number" && [0, 7, 14, 30, 90].includes(celebratedRaw)
      ? celebratedRaw
      : 0;

  let noteToStore: string | null;
  if (input.note !== undefined) {
    const trimmed = input.note?.trim() ?? "";
    noteToStore = trimmed.length > 0 ? trimmed.slice(0, 2000) : null;
  } else {
    const { data: existingRow } = await supabase
      .from("prayer_check_ins")
      .select("note")
      .eq("user_id", user.id)
      .eq("local_date", parsed.data)
      .maybeSingle();
    noteToStore = existingRow?.note ? String(existingRow.note) : null;
  }

  const { error: upsertErr } = await supabase.from("prayer_check_ins").upsert(
    {
      user_id: user.id,
      local_date: parsed.data,
      note: noteToStore,
      logged_at: new Date().toISOString(),
    },
    { onConflict: "user_id,local_date" }
  );

  if (upsertErr) {
    console.error(upsertErr);
    return upsertErr.code === "42P01"
      ? { error: "Run migration 009 in Supabase for prayer_check_ins." }
      : { error: "Could not save check-in." };
  }

  const { count, error: countErr } = await supabase
    .from("prayer_check_ins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countErr || count == null) {
    console.error(countErr);
  }

  const totalDays = count ?? 0;
  const next = nextMilestoneToCelebrate(totalDays, celebratedMilestone);
  let milestone: 7 | 14 | 30 | 90 | null = null;

  if (next) {
    celebratedMilestone = next;
    milestone = next;
    const { error: upProf } = await supabase
      .from("user_profiles")
      .update({ prayer_milestone_celebrated: next })
      .eq("id", user.id);
    if (upProf) console.error(upProf);
    await instrumentAnalyticsEvent("prayer_milestone_reached", { threshold: next });
  }

  await instrumentAnalyticsEvent("prayer_day_marked", { local_date: parsed.data });

  revalidatePath("/prayer-rhythm");
  revalidatePath("/home");

  return { ok: true, milestone, celebratedMilestone };
}

export async function updatePrayerNoteForDay(input: {
  localDate: string;
  note: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const d = ymd.safeParse(input.localDate);
  if (!d.success) return { error: "Invalid date." };
  const noteRaw = input.note?.trim() ?? "";
  const note = noteRaw.length > 0 ? noteRaw.slice(0, 2000) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("prayer_check_ins")
    .update({ note })
    .eq("user_id", user.id)
    .eq("local_date", d.data);

  if (error) {
    console.error(error);
    return { error: "Could not update note." };
  }

  revalidatePath("/prayer-rhythm");
  return { ok: true };
}

export async function logPrayerReminderDeepLink(): Promise<void> {
  await instrumentAnalyticsEvent("prayer_reminder_opened", {});
}
