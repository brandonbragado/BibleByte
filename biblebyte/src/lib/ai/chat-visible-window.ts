import type { AiChatMessageDto } from "@/lib/ai/types";

/** How many recent **user** prompts (and all messages after the oldest of those) show in the main companion panel. */
export const COMPANION_PANEL_USER_PROMPTS = 5;

/**
 * Returns the suffix of `messages` that includes at most the last `maxUserPrompts`
 * user turns: from the `maxUserPrompts`-th user message from the end through the
 * latest message (so assistant replies stay paired with their prompt).
 */
export function sliceMessagesForLastUserPrompts(
  messages: AiChatMessageDto[],
  maxUserPrompts: number
): AiChatMessageDto[] {
  if (messages.length === 0 || maxUserPrompts <= 0) {
    return messages;
  }

  let userCount = 0;
  let start = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      userCount++;
      if (userCount === maxUserPrompts) {
        start = i;
        break;
      }
    }
  }
  return messages.slice(start);
}

export function panelOmitsOlderMessages(
  messages: AiChatMessageDto[],
  maxUserPrompts: number
): boolean {
  if (messages.length === 0) return false;
  let userCount = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      userCount++;
      if (userCount > maxUserPrompts) return true;
    }
  }
  return false;
}
