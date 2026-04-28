/** Today's calendar date in UTC as `YYYY-MM-DD` (matches `daily_reflections.entry_date`). */
export function utcTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
