import { describe, expect, it } from "vitest";

import {
  AI_CHAT_MAX_MESSAGE_CHARS,
  isLikelyUuid,
  normalizeOpenAiApiKeyFromEnv,
  sanitizeChatInput,
} from "@/lib/ai/safety";

describe("sanitizeChatInput", () => {
  it("rejects empty/whitespace", () => {
    expect(sanitizeChatInput("")).toEqual({ ok: false, error: "Message cannot be empty." });
    expect(sanitizeChatInput("   \t")).toEqual({ ok: false, error: "Message cannot be empty." });
  });

  it("strips control characters and trims", () => {
    const r = sanitizeChatInput(" \u0001Hello\u007f ");
    expect(r).toEqual({ ok: true, text: "Hello" });
  });

  it("rejects overly long input", () => {
    const long = "a".repeat(AI_CHAT_MAX_MESSAGE_CHARS + 1);
    const r = sanitizeChatInput(long);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("too long");
    }
  });
});

describe("isLikelyUuid", () => {
  it("accepts v4-style uuids", () => {
    expect(isLikelyUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isLikelyUuid("not-a-uuid")).toBe(false);
    expect(isLikelyUuid("")).toBe(false);
  });
});

describe("normalizeOpenAiApiKeyFromEnv", () => {
  it("strips surrounding double quotes", () => {
    expect(normalizeOpenAiApiKeyFromEnv('"sk-test"')).toBe("sk-test");
  });

  it("strips surrounding single quotes", () => {
    expect(normalizeOpenAiApiKeyFromEnv("'sk-proj-abc'")).toBe("sk-proj-abc");
  });

  it("returns undefined for empty and null", () => {
    expect(normalizeOpenAiApiKeyFromEnv("")).toBeUndefined();
    expect(normalizeOpenAiApiKeyFromEnv("   ")).toBeUndefined();
    expect(normalizeOpenAiApiKeyFromEnv(undefined)).toBeUndefined();
    expect(normalizeOpenAiApiKeyFromEnv(null)).toBeUndefined();
  });
});
