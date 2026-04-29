import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { normalizeOpenAiApiKeyFromEnv } from "@/lib/ai/safety";
import { COMPANION_SYSTEM_PROMPT } from "@/lib/companion/system-prompt";
import type { CompanionBlocks } from "@/types/companion";

/** Max persisted messages loaded as context (user + assistant pairs). */
export const COMPANION_CONTEXT_MESSAGE_LIMIT = 24;

const PLACEHOLDER: CompanionBlocks = {
  understanding:
    "OpenAI is not configured yet—this is placeholder rhythm text so you can preview layout.",
  scripture:
    "Consider Psalm 23 as a gentle reminder of God's presence with those who walk through valleys—not legal advice or licensed counseling.",
  application:
    "When overwhelmed, pause for three breaths and name one concrete kindness you can offer yourself or someone else today.",
  prayer:
    "Lord Jesus, thank You for staying near in uncertainty. Teach me to listen for Your kindness today.",
};

function parseBlocksFromContent(raw: string): CompanionBlocks {
  const parsed = JSON.parse(raw) as Record<string, string>;
  return {
    understanding: parsed.understanding ?? "",
    scripture: parsed.scripture ?? "",
    application: parsed.application ?? "",
    prayer: parsed.prayer ?? "",
  };
}

/**
 * Full companion completion: system prompt + optional multi-turn history.
 * `conversationTurns` must be user/assistant only (no system); oldest first.
 */
export async function generateCompanionBlocks(
  conversationTurns: ChatCompletionMessageParam[]
): Promise<{ blocks: CompanionBlocks; demo: boolean }> {
  if (!conversationTurns.length) {
    return { blocks: PLACEHOLDER, demo: true };
  }

  const last = conversationTurns[conversationTurns.length - 1];
  if (last.role !== "user" || !String(last.content ?? "").trim()) {
    return { blocks: PLACEHOLDER, demo: true };
  }

  const apiKey = normalizeOpenAiApiKeyFromEnv(process.env.OPENAI_API_KEY);

  if (!apiKey) {
    return {
      blocks: PLACEHOLDER,
      demo: true,
    };
  }

  const client = new OpenAI({ apiKey });

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: COMPANION_SYSTEM_PROMPT },
    ...conversationTurns,
  ];

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
    temperature: 0.65,
    response_format: { type: "json_object" },
    messages,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty completion");
  }

  const blocks = parseBlocksFromContent(raw);
  return { blocks, demo: false };
}
