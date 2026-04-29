import { describe, expect, it } from "vitest";

import {
  displayDailyVerseReference,
  parseDailyVerseReference,
} from "@/lib/bible/parse-daily-reference";

describe("parseDailyVerseReference", () => {
  it("parses John with placeholder suffix", () => {
    const r = parseDailyVerseReference("John 3:16 (placeholder)");
    expect(r?.bookCode).toBe("JHN");
    expect(r?.chapter).toBe(3);
    expect(r?.verseStart).toBe(16);
    expect(r?.verseEnd).toBe(16);
  });

  it("parses Psalm range with en dash", () => {
    const r = parseDailyVerseReference("Psalm 23:1–3 (placeholder)");
    expect(r?.bookCode).toBe("PSA");
    expect(r?.verseStart).toBe(1);
    expect(r?.verseEnd).toBe(3);
  });

  it("parses 1 Corinthians", () => {
    const r = parseDailyVerseReference("1 Corinthians 13:4 (placeholder)");
    expect(r?.bookCode).toBe("1CO");
    expect(r?.chapter).toBe(13);
    expect(r?.verseStart).toBe(4);
  });

  it("returns null for garbage", () => {
    expect(parseDailyVerseReference("not a ref")).toBeNull();
  });
});

describe("displayDailyVerseReference", () => {
  it("strips trailing (placeholder) case-insensitively", () => {
    expect(displayDailyVerseReference("John 3:16 (placeholder)")).toBe("John 3:16");
    expect(displayDailyVerseReference("Psalm 23:1–3 (PLACEHOLDER)")).toBe("Psalm 23:1–3");
  });

  it("leaves refs without suffix unchanged", () => {
    expect(displayDailyVerseReference("Romans 8:28")).toBe("Romans 8:28");
  });
});
