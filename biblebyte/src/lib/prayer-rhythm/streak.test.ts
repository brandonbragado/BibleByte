import { describe, expect, it } from "vitest";

import { addDaysYmd } from "./dates";
import {
  computeBestStreakWithGrace,
  computeStreakWithGrace,
  nextMilestoneToCelebrate,
} from "./streak";

describe("computeStreakWithGrace", () => {
  it("counts consecutive days with check-ins", () => {
    const s = new Set(["2025-04-25", "2025-04-26", "2025-04-27"]);
    expect(computeStreakWithGrace(s, "2025-04-27")).toBe(3);
  });

  it("allows one gap day in the backward walk", () => {
    const s = new Set(["2025-04-25", "2025-04-27"]);
    expect(computeStreakWithGrace(s, "2025-04-27")).toBe(2);
  });

  it("consumes grace on the anchor day when today is not checked in", () => {
    const s = new Set(["2025-04-26", "2025-04-25"]);
    expect(computeStreakWithGrace(s, "2025-04-27")).toBe(2);
  });

  it("stops after a second gap", () => {
    const s = new Set(["2025-04-23", "2025-04-27"]);
    expect(computeStreakWithGrace(s, "2025-04-27")).toBe(1);
  });

  it("duplicate anchor logic is stable across duplicate taps (same set)", () => {
    const s = new Set(["2025-04-27"]);
    expect(computeStreakWithGrace(s, "2025-04-27")).toBe(1);
  });

  it("handles timezone-safe day arithmetic around month boundary", () => {
    const s = new Set(["2025-03-31", "2025-04-01"]);
    expect(computeStreakWithGrace(s, "2025-04-01")).toBe(2);
    expect(addDaysYmd("2025-04-01", -1)).toBe("2025-03-31");
  });
});

describe("computeBestStreakWithGrace", () => {
  it("returns 0 for empty list", () => {
    expect(computeBestStreakWithGrace([])).toBe(0);
  });

  it("returns longest grace-connected run", () => {
    const dates = ["2025-04-01", "2025-04-03", "2025-04-10", "2025-04-12"];
    expect(computeBestStreakWithGrace(dates)).toBe(2);
  });
});

describe("nextMilestoneToCelebrate", () => {
  it("returns next threshold after celebrated", () => {
    expect(nextMilestoneToCelebrate(7, 0)).toBe(7);
    expect(nextMilestoneToCelebrate(7, 7)).toBe(null);
    expect(nextMilestoneToCelebrate(14, 7)).toBe(14);
    expect(nextMilestoneToCelebrate(20, 14)).toBe(null);
    expect(nextMilestoneToCelebrate(30, 14)).toBe(30);
  });
});
