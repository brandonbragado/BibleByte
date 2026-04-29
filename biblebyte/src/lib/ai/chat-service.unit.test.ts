import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "@/lib/ai/biblebyte-system-prompt";
import { buildPersonalizationSummary } from "@/lib/ai/chat-service";

describe("buildPersonalizationSummary", () => {
  it("returns empty when no profile", () => {
    expect(buildPersonalizationSummary(null)).toBe("");
  });

  it("includes name, tags, and onboarding fields", () => {
    const s = buildPersonalizationSummary({
      first_name: "Jordan",
      spiritual_tags: ["topic:peace", "topic:hope"],
      onboarding_data: {
        growth_focus: "peace",
        season: "busy",
        learning_style: "short",
        daily_minutes: "3",
        support_need: "prayer",
      },
    });
    expect(s).toContain("Jordan");
    expect(s).toContain("peace");
    expect(s).toContain("3");
  });
});

describe("buildSystemPrompt", () => {
  it("embeds personalization block", () => {
    const p = buildSystemPrompt("The user prefers brief replies.");
    expect(p).toContain("About this reader");
    expect(p).toContain("prefers brief");
  });
});
