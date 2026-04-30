import type { SupabaseClient } from "@supabase/supabase-js";

import { computeUtcConsecutiveDayStreak, utcTodayForStreak } from "@/lib/profile/streak";

export type ProfileStats = {
  streakDays: number;
  prayersAnswered: number;
  versesSaved: number;
  journalEntries: number;
  /** Distinct UTC calendar days in the current month with any counted activity. */
  activityDaysThisUtcMonth: number;
};

export async function loadProfileStats(supabase: SupabaseClient, userId: string): Promise<ProfileStats> {
  const today = utcTodayForStreak();

  const [
    reflectionsRes,
    journalRes,
    prayersRes,
    answeredRes,
    savedRes,
    journalCountRes,
  ] = await Promise.all([
    supabase.from("daily_reflections").select("entry_date, body").eq("user_id", userId),
    supabase.from("journal_entries").select("entry_date").eq("user_id", userId),
    supabase.from("prayers").select("created_at").eq("user_id", userId),
    supabase
      .from("prayers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "answered"),
    supabase
      .from("saved_verses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("journal_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const activityDates = new Set<string>();

  for (const row of reflectionsRes.data ?? []) {
    const body = typeof row.body === "string" ? row.body.trim() : "";
    if (body.length > 0 && row.entry_date) {
      activityDates.add(row.entry_date);
    }
  }

  for (const row of journalRes.data ?? []) {
    if (row.entry_date) activityDates.add(row.entry_date);
  }

  for (const row of prayersRes.data ?? []) {
    const raw = row.created_at as string | undefined;
    if (raw) {
      activityDates.add(raw.slice(0, 10));
    }
  }

  const streakDays = computeUtcConsecutiveDayStreak(activityDates, today);

  const monthPrefix = today.slice(0, 7);
  let activityDaysThisUtcMonth = 0;
  for (const d of activityDates) {
    if (d.startsWith(monthPrefix)) activityDaysThisUtcMonth += 1;
  }

  return {
    streakDays,
    prayersAnswered: answeredRes.count ?? 0,
    versesSaved: savedRes.count ?? 0,
    journalEntries: journalCountRes.count ?? 0,
    activityDaysThisUtcMonth,
  };
}
