import { describe, expect, it } from "vitest";

import { profileEncouragementLine } from "@/lib/profile/load-profile-context";

describe("profileEncouragementLine", () => {
  it("returns 14-day message when streak >= 14", () => {
    expect(
      profileEncouragementLine({
        streakDays: 14,
        prayersAnswered: 0,
        versesSaved: 0,
        journalEntries: 0,
        activityDaysThisUtcMonth: 0,
      })
    ).toContain("Two weeks");
  });

  it("returns 7-day message when streak is 7–13", () => {
    expect(
      profileEncouragementLine({
        streakDays: 7,
        prayersAnswered: 0,
        versesSaved: 0,
        journalEntries: 0,
        activityDaysThisUtcMonth: 0,
      })
    ).toContain("week");
  });

  it("falls back to month activity when streak < 7", () => {
    expect(
      profileEncouragementLine({
        streakDays: 3,
        prayersAnswered: 0,
        versesSaved: 0,
        journalEntries: 0,
        activityDaysThisUtcMonth: 5,
      })
    ).toContain("month");
  });

  it("returns null when nothing notable", () => {
    expect(
      profileEncouragementLine({
        streakDays: 2,
        prayersAnswered: 0,
        versesSaved: 0,
        journalEntries: 0,
        activityDaysThisUtcMonth: 2,
      })
    ).toBeNull();
  });
});
