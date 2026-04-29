/** Today's calendar date in UTC as `YYYY-MM-DD` (matches `daily_reflections.entry_date`). */
export function utcTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Display a UTC calendar day `YYYY-MM-DD` as `MM/DD/YYYY` (no timezone shift).
 */
export function formatIsoDateUs(isoYmd: string): string {
  const m = isoYmd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoYmd;
  const [, year, month, day] = m;
  return `${month}/${day}/${year}`;
}
