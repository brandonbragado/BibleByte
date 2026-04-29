import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("active Bible id policy", () => {
  const OLD_NIV_ID = process.env.API_BIBLE_NIV_BIBLE_ID;
  const OLD_LICENSE = process.env.NIV_SCRIPTURE_LICENSE_APPROVED;

  afterEach(() => {
    process.env.API_BIBLE_NIV_BIBLE_ID = OLD_NIV_ID;
    process.env.NIV_SCRIPTURE_LICENSE_APPROVED = OLD_LICENSE;
    vi.resetModules();
  });

  it("withholds API.Bible text until NIV licensing is approved", async () => {
    process.env.API_BIBLE_NIV_BIBLE_ID = "niv-id";
    process.env.NIV_SCRIPTURE_LICENSE_APPROVED = "false";
    vi.resetModules();

    const { getActiveBibleId, ScriptureApiError } = await import(
      "@/lib/scripture/scripture-service"
    ).then(async (mod) => ({
      ...mod,
      ScriptureApiError: (await import("@/lib/scripture/types")).ScriptureApiError,
    }));

    expect(() => getActiveBibleId()).toThrow(ScriptureApiError);
    try {
      getActiveBibleId();
    } catch (e) {
      expect(e).toMatchObject({ code: "niv_not_licensed", status: 503 });
    }
  });

  it("rejects alternate Bible ids when NIV is active", async () => {
    process.env.API_BIBLE_NIV_BIBLE_ID = "niv-id";
    process.env.NIV_SCRIPTURE_LICENSE_APPROVED = "true";
    vi.resetModules();

    const { resolveRequestedBibleId } = await import("@/lib/scripture/scripture-service");

    expect(resolveRequestedBibleId()).toBe("niv-id");
    expect(resolveRequestedBibleId("niv-id")).toBe("niv-id");
    expect(() => resolveRequestedBibleId("other-id")).toThrow(/NIV-only/);
  });
});
