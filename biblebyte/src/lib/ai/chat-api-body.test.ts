import { describe, expect, it } from "vitest";

import { parseAiChatRequestBody } from "@/lib/ai/chat-api-body";

describe("parseAiChatRequestBody", () => {
  it("parses message and optional sessionId", () => {
    expect(
      parseAiChatRequestBody({
        message: "Hello",
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      })
    ).toEqual({
      ok: true,
      value: {
        message: "Hello",
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
  });

  it("treats blank sessionId as null", () => {
    expect(parseAiChatRequestBody({ message: "x", sessionId: "  " })).toEqual({
      ok: true,
      value: { message: "x", sessionId: null },
    });
  });

  it("rejects non-objects", () => {
    expect(parseAiChatRequestBody(null).ok).toBe(false);
    expect(parseAiChatRequestBody([]).ok).toBe(false);
  });

  it("rejects wrong types", () => {
    expect(parseAiChatRequestBody({ message: 1 }).ok).toBe(false);
    expect(parseAiChatRequestBody({ message: "ok", sessionId: 1 }).ok).toBe(false);
  });
});
