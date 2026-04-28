import { utcTodayIsoDate } from "@/lib/date/utc-date";

/** Advance ISO date string (`YYYY-MM-DD`) by `deltaDays` using UTC calendar math. */
export function addUtcDays(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

/**
 * Counts consecutive UTC calendar days backward from `startDate` where each day appears in `activityDates`.
 */
export function computeUtcConsecutiveDayStreak(activityDates: Iterable<string>, startDate: string): number {
  const set = new Set(activityDates);
  let streak = 0;
  let cursor = startDate;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

export function utcTodayForStreak(): string {
  return utcTodayIsoDate();
}
