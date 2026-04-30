import { describe, expect, it } from "vitest";

import {
  COMPANION_PANEL_USER_PROMPTS,
  panelOmitsOlderMessages,
  sliceMessagesForLastUserPrompts,
} from "./chat-visible-window";
import type { AiChatMessageDto } from "./types";

function u(id: string, content: string): AiChatMessageDto {
  return { id, role: "user", content, created_at: "" };
}
function a(id: string, content: string): AiChatMessageDto {
  return { id, role: "assistant", content, created_at: "" };
}

describe("sliceMessagesForLastUserPrompts", () => {
  it("returns all when under the limit", () => {
    const m = [u("1", "a"), a("2", "b"), u("3", "c")];
    expect(sliceMessagesForLastUserPrompts(m, COMPANION_PANEL_USER_PROMPTS)).toEqual(m);
    expect(panelOmitsOlderMessages(m, COMPANION_PANEL_USER_PROMPTS)).toBe(false);
  });

  it("drops turns before the 5th-from-last user message", () => {
    const m = [
      u("u1", "1"),
      a("a1", "r1"),
      u("u2", "2"),
      a("a2", "r2"),
      u("u3", "3"),
      a("a3", "r3"),
      u("u4", "4"),
      a("a4", "r4"),
      u("u5", "5"),
      a("a5", "r5"),
      u("u6", "6"),
      a("a6", "r6"),
    ];
    const win = sliceMessagesForLastUserPrompts(m, 5);
    expect(win[0].id).toBe("u2");
    expect(win.length).toBe(10);
    expect(panelOmitsOlderMessages(m, 5)).toBe(true);
  });

  it("keeps only the last N user prompts when there are more", () => {
    const m = [u("u1", "1"), a("a1", "r1"), u("u2", "2"), a("a2", "r2"), u("u3", "3"), a("a3", "r3"), u("u4", "4"), a("a4", "r4")];
    const win = sliceMessagesForLastUserPrompts(m, 2);
    expect(win.map((x) => x.id).join(",")).toBe("u3,a3,u4,a4");
    expect(panelOmitsOlderMessages(m, 2)).toBe(true);
  });
});
