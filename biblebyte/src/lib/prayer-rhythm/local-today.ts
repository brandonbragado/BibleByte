/** User-local calendar date in the browser (`YYYY-MM-DD`). */
export function browserLocalTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function browserLocalYearMonth(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftMonthYm(ym: string, delta: number): string {
  const [ys, ms] = ym.split("-");
  const base = new Date(Number(ys), Number(ms) - 1 + delta, 1);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
