import { describe, expect, it } from "vitest";

import { isRetryableApiBibleStatus } from "@/lib/scripture/api-bible-http";
import {
  clampSearchLimit,
  sanitizeBibleId,
  sanitizePassageId,
  sanitizeSearchQuery,
  SEARCH_QUERY_MAX_LENGTH,
} from "@/lib/scripture/sanitize";

describe("sanitize", () => {
  it("accepts typical API.Bible ids", () => {
    expect(sanitizeBibleId("  78a9f6124f344018-01  ")).toBe("78a9f6124f344018-01");
    expect(sanitizeBibleId("../etc/passwd")).toBe(null);
    expect(sanitizeBibleId("a".repeat(70))).toBe(null);
  });

  it("accepts passage ids with colons and dots", () => {
    expect(sanitizePassageId("GEN.1.1")).toBe("GEN.1.1");
    expect(sanitizePassageId("uuid-like-abc-123")).toBe("uuid-like-abc-123");
    expect(sanitizePassageId("")).toBe(null);
  });

  it("clamps search limit", () => {
    expect(clampSearchLimit(null)).toBe(20);
    expect(clampSearchLimit("3")).toBe(3);
    expect(clampSearchLimit("99")).toBe(50);
  });

  it("validates query length", () => {
    expect(sanitizeSearchQuery("ab")).toBe("ab");
    expect(sanitizeSearchQuery("a")).toBe(null);
    expect(sanitizeSearchQuery("a".repeat(SEARCH_QUERY_MAX_LENGTH + 1))).toBe(null);
  });
});

describe("api-bible-http helpers", () => {
  it("marks transient statuses as retryable", () => {
    expect(isRetryableApiBibleStatus(502)).toBe(true);
    expect(isRetryableApiBibleStatus(503)).toBe(true);
    expect(isRetryableApiBibleStatus(401)).toBe(false);
  });
});
