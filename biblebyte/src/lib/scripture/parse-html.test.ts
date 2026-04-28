import { describe, expect, it } from "vitest";

import { parseVersesFromChapterHtml } from "@/lib/scripture/scripture-service";

describe("parseVersesFromChapterHtml", () => {
  it("parses data-number verse chunks", () => {
    const html = `<div class="chapter"><span data-number="1">In the beginning</span><span data-number="2">And the earth</span></div>`;
    const v = parseVersesFromChapterHtml(html);
    expect(v.map((x) => x.verseNumber)).toEqual([1, 2]);
    expect(v[0].text).toContain("beginning");
  });

  it("returns empty for blank html", () => {
    expect(parseVersesFromChapterHtml("")).toEqual([]);
  });
});
