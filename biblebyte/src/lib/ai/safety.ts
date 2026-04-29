export const AI_CHAT_MAX_MESSAGE_CHARS = 6_000;
export const AI_CHAT_HISTORY_LIMIT = 20;

const CTRL = /[\u0000-\u001F\u007F]/g;

export type SanitizeResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * Trims, strips control chars, enforces max length. Returns safe text for DB + model input.
 */
export function sanitizeChatInput(raw: string): SanitizeResult {
  const text = raw.replace(CTRL, "").trim();
  if (!text) {
    return { ok: false, error: "Message cannot be empty." };
  }
  if (text.length > AI_CHAT_MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      error: `Message is too long (max ${AI_CHAT_MAX_MESSAGE_CHARS} characters).`,
    };
  }
  return { ok: true, text };
}

export function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}
