import OpenAI from "openai";
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  PermissionDeniedError,
  RateLimitError,
} from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildSystemPrompt } from "@/lib/ai/biblebyte-system-prompt";
import {
  AI_CHAT_HISTORY_LIMIT,
  AI_CHAT_MAX_MESSAGE_CHARS,
  isLikelyUuid,
  normalizeOpenAiApiKeyFromEnv,
  sanitizeChatInput,
} from "@/lib/ai/safety";
import type { AiChatApiResponse, AiChatMessageDto, AiChatMessageRow } from "@/lib/ai/types";

export const HOME_AI_SESSION_TITLE = "BibleByte Home";

/** Max rows loaded for Home companion UI + history (not the model context cap). */
export const HOME_AI_UI_MESSAGE_LOAD_LIMIT = 200;

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

type ProfileForAi = {
  first_name: string | null;
  spiritual_tags: string[] | null;
  onboarding_data: Record<string, unknown> | null;
};

export function buildPersonalizationSummary(row: ProfileForAi | null): string {
  if (!row) return "";
  const parts: string[] = [];
  if (row.first_name?.trim()) {
    parts.push(`Preferred name: ${row.first_name.trim()}.`);
  }
  const tags = row.spiritual_tags ?? [];
  if (tags.length > 0) {
    const clean = tags.slice(0, 10).map((t) => t.replace(/^[^:]+:/, "").replace(/_/g, " "));
    parts.push(`Topics / focuses they chose: ${clean.join(", ")}.`);
  }
  const od = row.onboarding_data;
  if (od && typeof od === "object") {
    const gf = od.growth_focus;
    const season = od.season;
    const learn = od.learning_style;
    const minutes = od.daily_minutes;
    const support = od.support_need;
    if (typeof gf === "string" && gf) parts.push(`Hoping to grow in: ${gf}.`);
    if (typeof season === "string" && season) parts.push(`Life season they named: ${season}.`);
    if (typeof learn === "string" && learn) parts.push(`Learning preference: ${learn}.`);
    if (typeof minutes === "string" && minutes) {
      parts.push(`Typical daily time they offered: ${minutes}.`);
    }
    if (typeof support === "string" && support) parts.push(`Support they asked for: ${support}.`);
  }
  return parts.join(" ");
}

function rowsToOpenAiTurns(rows: AiChatMessageRow[]): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [];
  for (const r of rows) {
    if (r.role === "system") continue;
    if (r.role !== "user" && r.role !== "assistant") continue;
    const text = r.content.trim();
    if (!text) continue;
    out.push({ role: r.role, content: text.slice(0, AI_CHAT_MAX_MESSAGE_CHARS) });
  }
  return out;
}

async function completeAssistantReply(
  systemPrompt: string,
  turns: ChatCompletionMessageParam[]
): Promise<string> {
  const apiKey = normalizeOpenAiApiKeyFromEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new ChatServiceError("AI is not configured (OPENAI_API_KEY).", 503, "ai_not_configured");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.55,
      max_tokens: 500,
      messages: [{ role: "system", content: systemPrompt }, ...turns],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new ChatServiceError("The model returned an empty reply.", 502, "empty_completion");
    }
    return text.slice(0, AI_CHAT_MAX_MESSAGE_CHARS);
  } catch (e: unknown) {
    if (e instanceof ChatServiceError) throw e;

    if (e instanceof APIConnectionError || e instanceof APIConnectionTimeoutError) {
      console.error(e);
      throw new ChatServiceError(
        "Cannot reach OpenAI (network or timeout). Check your connection, VPN, or firewall, then try again.",
        503,
        "openai_network"
      );
    }

    if (e instanceof AuthenticationError) {
      console.error(e);
      throw new ChatServiceError(
        "OpenAI rejected the API key (401). Confirm OPENAI_API_KEY in .env.local has no quotes or spaces, starts with sk-, matches platform.openai.com, then restart npm run dev.",
        503,
        "openai_invalid_key"
      );
    }

    if (e instanceof PermissionDeniedError) {
      console.error(e);
      throw new ChatServiceError(
        "OpenAI returned 403. Confirm this key is for an active project with Chat Completions access.",
        503,
        "openai_permission"
      );
    }

    if (e instanceof RateLimitError) {
      console.error(e);
      throw new ChatServiceError(
        "OpenAI rate or usage limit (429). Wait a bit, or check Usage and billing at platform.openai.com.",
        503,
        "openai_rate_limited"
      );
    }

    if (e instanceof BadRequestError) {
      console.error(e);
      const msg = e.message?.toLowerCase() ?? "";
      if (msg.includes("model")) {
        throw new ChatServiceError(
          `Model "${model}" isn’t available to this key. Set OPENAI_CHAT_MODEL to a model your account can use (often gpt-4o-mini) and restart the server.`,
          503,
          "openai_model"
        );
      }
      throw new ChatServiceError(
        "OpenAI rejected the request (400). Check the server terminal for the detailed error.",
        503,
        "openai_bad_request"
      );
    }

    if (e instanceof APIError) {
      console.error(e);
      const status = e.status;
      const body = e.message?.toLowerCase() ?? "";
      if (
        status === 402 ||
        body.includes("insufficient") ||
        body.includes("quota") ||
        body.includes("billing") ||
        body.includes("credit")
      ) {
        throw new ChatServiceError(
          "OpenAI billing or quota: add a payment method or credits at platform.openai.com/account/billing, then retry.",
          503,
          "openai_billing"
        );
      }
      throw new ChatServiceError(
        `OpenAI returned HTTP ${status ?? "error"}. See the terminal where Next.js is running for details.`,
        503,
        "openai_upstream"
      );
    }

    console.error(e);
    throw new ChatServiceError(
      "OpenAI request failed for an unexpected reason. See the server terminal for the stack trace.",
      503,
      "openai_error"
    );
  }
}

/**
 * Home / API chat turn: validates user, persists messages, calls OpenAI with history + personalization.
 */
export async function processAiChatTurn(opts: {
  supabase: SupabaseClient;
  userId: string;
  sessionIdInput?: string | null;
  rawMessage: string;
}): Promise<AiChatApiResponse> {
  const sanitized = sanitizeChatInput(opts.rawMessage);
  if (!sanitized.ok) {
    throw new ChatServiceError(sanitized.error, 400, "invalid_message");
  }
  const message = sanitized.text;

  let sessionId = opts.sessionIdInput?.trim() ?? "";

  if (sessionId && !isLikelyUuid(sessionId)) {
    throw new ChatServiceError("Invalid session id.", 400, "invalid_session");
  }

  const { data: profile, error: profileErr } = await opts.supabase
    .from("user_profiles")
    .select("first_name, spiritual_tags, onboarding_data")
    .eq("id", opts.userId)
    .maybeSingle();

  if (profileErr) {
    console.error(profileErr);
  }

  const personalization = buildPersonalizationSummary(
    (profile ?? null) as ProfileForAi | null
  );
  const systemPrompt = buildSystemPrompt(personalization);

  if (!sessionId) {
    const { data: existing, error: findErr } = await opts.supabase
      .from("chat_sessions")
      .select("id")
      .eq("user_id", opts.userId)
      .eq("title", HOME_AI_SESSION_TITLE)
      .maybeSingle();

    if (findErr) {
      console.error(findErr);
      throw new ChatServiceError("Could not resolve chat session.", 500, "session_lookup_failed");
    }

    if (existing?.id) {
      sessionId = existing.id;
    } else {
      const { data: created, error: insErr } = await opts.supabase
        .from("chat_sessions")
        .insert({ user_id: opts.userId, title: HOME_AI_SESSION_TITLE })
        .select("id")
        .single();

      if (insErr || !created?.id) {
        console.error(insErr);
        throw new ChatServiceError("Could not start chat session.", 500, "session_create_failed");
      }
      sessionId = created.id;
    }
  } else {
    const { data: session, error: sessErr } = await opts.supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", opts.userId)
      .maybeSingle();

    if (sessErr || !session?.id) {
      throw new ChatServiceError("Chat session not found.", 404, "session_not_found");
    }
  }

  const { error: userInsErr } = await opts.supabase.from("chat_messages").insert({
    session_id: sessionId,
    user_id: opts.userId,
    role: "user",
    content: message,
  });

  if (userInsErr) {
    console.error(userInsErr);
    if (userInsErr.message?.includes("content") || userInsErr.code === "42703") {
      throw new ChatServiceError(
        "Database needs migration 008_chat_messages_text_user.sql for AI chat.",
        503,
        "schema_outdated"
      );
    }
    throw new ChatServiceError("Could not save your message.", 500, "user_message_failed");
  }

  const { data: recentDesc, error: histErr } = await opts.supabase
    .from("chat_messages")
    .select("id, session_id, user_id, role, content, created_at")
    .eq("session_id", sessionId)
    .eq("user_id", opts.userId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(AI_CHAT_HISTORY_LIMIT);

  if (histErr) {
    console.error(histErr);
    throw new ChatServiceError("Could not load chat history.", 500, "history_failed");
  }

  const chronological = [...(recentDesc ?? [])].reverse() as AiChatMessageRow[];
  const turns = rowsToOpenAiTurns(chronological);

  const assistantText = await completeAssistantReply(systemPrompt, turns);

  const { error: asstErr } = await opts.supabase.from("chat_messages").insert({
    session_id: sessionId,
    user_id: opts.userId,
    role: "assistant",
    content: assistantText,
  });

  if (asstErr) {
    console.error(asstErr);
    throw new ChatServiceError("Could not save the assistant reply.", 500, "assistant_save_failed");
  }

  await opts.supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  console.info(
    JSON.stringify({
      event: "ai_chat_turn",
      session_id: sessionId,
      user_message_len: message.length,
      assistant_len: assistantText.length,
    })
  );

  return {
    sessionId,
    message: { role: "assistant", content: assistantText },
  };
}

/** Server component helper — load Home session + recent messages for UI. */
export async function loadHomeAiChatState(
  supabase: SupabaseClient,
  userId: string
): Promise<{ sessionId: string | null; messages: AiChatMessageDto[] }> {
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("title", HOME_AI_SESSION_TITLE)
    .maybeSingle();

  if (!session?.id) {
    return { sessionId: null, messages: [] };
  }

  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", session.id)
    .eq("user_id", userId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(HOME_AI_UI_MESSAGE_LOAD_LIMIT);

  if (error) {
    console.error(error);
    return { sessionId: session.id, messages: [] };
  }

  const messages: AiChatMessageDto[] = (rows ?? [])
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      content: typeof r.content === "string" ? r.content : String(r.content),
      created_at: r.created_at,
    }));

  return { sessionId: session.id, messages };
}
