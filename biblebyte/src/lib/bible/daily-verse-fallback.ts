/**
 * When `daily_verses` has no row for a calendar day (e.g. seed only covered 90 days),
 * rotate the same references as migration 004 so the home card still works.
 */
export const DAILY_VERSE_REFERENCE_ROTATION = [
  "John 3:16",
  "Psalm 23:1–3",
  "Romans 8:28",
  "Philippians 4:6–7",
  "Isaiah 41:10",
  "Matthew 11:28–30",
  "Psalm 46:10",
  "Jeremiah 29:11",
] as const;

export type DailyVerseRowShape = {
  reference: string;
  body_placeholder: string;
  attribution_note: string | null;
};

/** Deterministic pick so the same UTC date always maps to the same verse reference. */
export function stableDayIndexFromIsoDate(isoDate: string, modulo: number): number {
  let h = 2166136261;
  for (let i = 0; i < isoDate.length; i++) {
    h ^= isoDate.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}

export function getFallbackDailyVerseForDate(isoDate: string): DailyVerseRowShape {
  const refs = DAILY_VERSE_REFERENCE_ROTATION;
  const ref = refs[stableDayIndexFromIsoDate(isoDate, refs.length)] ?? refs[0];
  return {
    reference: `${ref} (placeholder)`,
    body_placeholder:
      "Open your Bible for today’s passage — we’ll show the text here when scripture is connected for this day.",
    attribution_note: null,
  };
}
