import { NextResponse } from "next/server";

import { parseAiChatRequestBody } from "@/lib/ai/chat-api-body";
import { ChatServiceError, processAiChatTurn } from "@/lib/ai/chat-service";
import { rateLimitResponse } from "@/lib/rate-limit/memory";
import { createClient } from "@/lib/supabase/server";

function safeErrorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * POST /api/ai/chat — authenticated companion; OpenAI key stays server-only.
 * Body: { sessionId?: string, message: string }
 */
export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "chat");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return safeErrorResponse("Invalid JSON body.", "invalid_json", 400);
  }

  const parsed = parseAiChatRequestBody(body);
  if (!parsed.ok) {
    return safeErrorResponse(parsed.error, parsed.code, 400);
  }
  const { message, sessionId } = parsed.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return safeErrorResponse("Sign in required.", "unauthorized", 401);
  }

  try {
    const result = await processAiChatTurn({
      supabase,
      userId: user.id,
      sessionIdInput: sessionId,
      rawMessage: message,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ChatServiceError) {
      return safeErrorResponse(e.message, e.code, e.status);
    }
    console.error(e);
    return safeErrorResponse("Unexpected error.", "internal", 500);
  }
}
