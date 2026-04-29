import { describe, expect, it } from "vitest";

import {
  getRotatingQuickPrompts,
  QUICK_PROMPT_POOL,
  quickPromptsUtcSlot,
} from "@/lib/ai/quick-prompts";

describe("getRotatingQuickPrompts", () => {
  it("returns a fixed subset size", () => {
    const p = getRotatingQuickPrompts(new Date("2026-04-27T12:00:00.000Z"), 8);
    expect(p).toHaveLength(8);
    expect(new Set(p).size).toBe(8);
  });

  it("is stable for the same instant", () => {
    const d = new Date("2026-01-15T08:30:00.000Z");
    expect(getRotatingQuickPrompts(d)).toEqual(getRotatingQuickPrompts(d));
  });

  it("changes when crossing a 4-hour UTC boundary", () => {
    const a = getRotatingQuickPrompts(new Date("2026-06-01T03:59:59.999Z"));
    const b = getRotatingQuickPrompts(new Date("2026-06-01T04:00:00.000Z"));
    expect(a).not.toEqual(b);
  });

  it("only uses prompts from the pool", () => {
    const p = getRotatingQuickPrompts(new Date("2026-11-20T00:00:00.000Z"));
    for (const line of p) {
      expect(QUICK_PROMPT_POOL).toContain(line);
    }
  });
});

describe("quickPromptsUtcSlot", () => {
  it("increments across a 4h boundary", () => {
    const s0 = quickPromptsUtcSlot(new Date("2026-01-01T00:00:00.000Z"));
    const s1 = quickPromptsUtcSlot(new Date("2026-01-01T04:00:00.000Z"));
    expect(s1).toBe(s0 + 1);
  });
});
