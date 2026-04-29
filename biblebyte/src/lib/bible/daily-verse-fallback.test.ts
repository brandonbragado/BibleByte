import { describe, expect, it } from "vitest";

import {
  DAILY_VERSE_REFERENCE_ROTATION,
  getFallbackDailyVerseForDate,
  stableDayIndexFromIsoDate,
} from "@/lib/bible/daily-verse-fallback";

describe("getFallbackDailyVerseForDate", () => {
  it("is stable for the same UTC date", () => {
    const a = getFallbackDailyVerseForDate("2026-04-27");
    const b = getFallbackDailyVerseForDate("2026-04-27");
    expect(a).toEqual(b);
    expect(a.reference.endsWith("(placeholder)")).toBe(true);
  });

  it("uses only rotation references (base, without suffix)", () => {
    const row = getFallbackDailyVerseForDate("2026-01-15");
    const base = row.reference.replace(/\s*\(placeholder\)\s*$/i, "").trim();
    expect(DAILY_VERSE_REFERENCE_ROTATION).toContain(base);
  });
});

describe("stableDayIndexFromIsoDate", () => {
  it("maps into range", () => {
    expect(stableDayIndexFromIsoDate("2026-04-27", 8)).toBeGreaterThanOrEqual(0);
    expect(stableDayIndexFromIsoDate("2026-04-27", 8)).toBeLessThan(8);
  });
});
