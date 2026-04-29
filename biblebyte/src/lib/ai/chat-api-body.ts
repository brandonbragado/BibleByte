export type ParsedAiChatBody = {
  sessionId: string | null;
  message: string;
};

export type ParseAiChatBodyResult =
  | { ok: true; value: ParsedAiChatBody }
  | { ok: false; error: string; code: string };

/**
 * Validates shape of POST /api/ai/chat JSON (before auth and sanitization).
 */
export function parseAiChatRequestBody(body: unknown): ParseAiChatBodyResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object.", code: "invalid_body" };
  }
  const o = body as Record<string, unknown>;
  if ("message" in o && typeof o.message !== "string") {
    return {
      ok: false,
      error: 'Field "message" must be a string.',
      code: "invalid_message_type",
    };
  }
  if ("sessionId" in o && o.sessionId != null && typeof o.sessionId !== "string") {
    return {
      ok: false,
      error: 'Field "sessionId" must be a string.',
      code: "invalid_session_type",
    };
  }

  const message = typeof o.message === "string" ? o.message : "";
  const sessionId =
    typeof o.sessionId === "string" && o.sessionId.trim() ? o.sessionId.trim() : null;

  return { ok: true, value: { sessionId, message } };
}
