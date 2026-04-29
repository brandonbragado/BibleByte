import { describe, expect, it } from "vitest";

import { parseVersesFromChapterHtml } from "@/lib/scripture/scripture-service";

describe("parseVersesFromChapterHtml", () => {
  it("parses data-number verse chunks", () => {
    const html = `<div class="chapter"><span data-number="1">In the beginning</span><span data-number="2">And the earth</span></div>`;
    const v = parseVersesFromChapterHtml(html);
    expect(v.map((x) => x.verseNumber)).toEqual([1, 2]);
    expect(v[0].text).toContain("beginning");
  });

  it("strips duplicate leading verse digit from publisher markup", () => {
    const html = `<span data-number="1"><sup>1</sup> The Lord is my shepherd</span><span data-number="2"><sup>2</sup> He makes me lie down</span>`;
    const v = parseVersesFromChapterHtml(html);
    expect(v[0]?.text).toBe("The Lord is my shepherd");
    expect(v[1]?.text).toBe("He makes me lie down");
  });

  it("drops a cut-off tag tail left in a capture group", () => {
    const html = `<span data-number="1">The Lord is my shepherd <span`;
    const v = parseVersesFromChapterHtml(html);
    expect(v[0]?.text).not.toMatch(/</);
    expect(v[0]?.text).toBe("The Lord is my shepherd");
  });

  it("returns empty for blank html", () => {
    expect(parseVersesFromChapterHtml("")).toEqual([]);
  });
});
