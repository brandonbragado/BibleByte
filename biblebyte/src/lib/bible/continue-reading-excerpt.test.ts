import { describe, expect, it } from "vitest";

import {
  buildContinueReadingContextBlurb,
  buildContinueReadingExcerpt,
} from "./continue-reading-excerpt";
import { getBookByCode } from "./canon";

describe("buildContinueReadingExcerpt", () => {
  const verses = [
    { verseNumber: 1, text: "In the beginning God created the heavens and the earth." },
    { verseNumber: 2, text: "Now the earth was formless and empty, darkness was over the deep." },
    { verseNumber: 3, text: "And God said, Let there be light, and there was light." },
  ];

  it("joins neighbors around the bookmark verse", () => {
    const s = buildContinueReadingExcerpt(verses, 2, { maxChars: 500, neighborSpan: 1 });
    expect(s).toContain("1.");
    expect(s).toContain("2.");
    expect(s).toContain("3.");
  });

  it("truncates with ellipsis", () => {
    const s = buildContinueReadingExcerpt(verses, 1, { maxChars: 40, neighborSpan: 2 });
    expect(s?.endsWith("…")).toBe(true);
    expect(s!.length).toBeLessThanOrEqual(40);
  });

  it("returns null for empty verses", () => {
    expect(buildContinueReadingExcerpt([], 1)).toBeNull();
  });
});

describe("buildContinueReadingContextBlurb", () => {
  it("mentions reference and era", () => {
    const gen = getBookByCode("GEN")!;
    expect(buildContinueReadingContextBlurb(gen, 1, 1)).toContain("Genesis 1");
    expect(buildContinueReadingContextBlurb(gen, 1, 1)).toContain("Old Testament");
  });
});
