/** Parse `YYYY-MM-DD` to integer day index (UTC midnight math — consistent for streak gaps). */
export function ymdToDayIndex(ymd: string): number {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Invalid YYYY-MM-DD: ${ymd}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return Math.floor(Date.UTC(y, mo - 1, d) / 86_400_000);
}

export function dayIndexToYmd(idx: number): string {
  const t = new Date(idx * 86_400_000);
  const y = t.getUTCFullYear();
  const mo = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function addDaysYmd(ymd: string, delta: number): string {
  return dayIndexToYmd(ymdToDayIndex(ymd) + delta);
}

/** Calendar distance between two YYYY-MM-DD strings (non-negative). */
export function daysApartEarlierToLater(a: string, b: string): number {
  return ymdToDayIndex(b) - ymdToDayIndex(a);
}

export type MonthCell = {
  ymd: string;
  label: number;
  inMonth: boolean;
};

/** Build a Sun-first month grid for `year` (four-digit) and `month` 1–12. */
export function monthGrid(year: number, month: number): MonthCell[][] {
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: MonthCell[] = [];

  const prevMonthLast = new Date(year, month - 1, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    const d = new Date(year, month - 2, day);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const dy = d.getDate();
    const ymd = `${y}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}`;
    cells.push({ ymd, label: dy, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ ymd, label: day, inMonth: true });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month, i);
      const y = d.getFullYear();
      const mo = d.getMonth() + 1;
      const dy = d.getDate();
      const ymd = `${y}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}`;
      cells.push({ ymd, label: dy, inMonth: false });
    }
  }

  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
