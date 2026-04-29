import { describe, expect, it } from "vitest";

import { resolveGreetingFirstName } from "@/lib/profile/greeting-name";

describe("resolveGreetingFirstName", () => {
  it("prefers first_name over display_name", () => {
    expect(
      resolveGreetingFirstName(
        { first_name: "brandon", display_name: "Bragadough" },
        "x@y.com"
      )
    ).toBe("Brandon");
  });

  it("falls back to display_name token", () => {
    expect(resolveGreetingFirstName({ display_name: "Alex Morgan" }, undefined)).toBe("Alex");
  });

  it("falls back to email local part", () => {
    expect(resolveGreetingFirstName({}, "MARIA.smith@example.com")).toBe("Maria");
  });

  it("defaults to Friend", () => {
    expect(resolveGreetingFirstName(null, undefined)).toBe("Friend");
  });
});
