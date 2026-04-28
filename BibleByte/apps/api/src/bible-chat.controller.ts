import {
  BadRequestException,
  Body,
  Controller,
  Post,
  ServiceUnavailableException,
  UseGuards
} from "@nestjs/common";
import { SupabaseAuthGuard } from "./common/auth.guard";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are BibleByte Guide, a calm Christian study assistant focused on the Holy Bible.

Rules:
- Discuss meaning, historical context, literary context, themes, original-language nuances at a lay level, and application ideas grounded in scripture.
- Prefer citing passages by reference (e.g., John 3:16) rather than quoting long copyrighted blocks. Do not invent verse wording—when unsure, say so.
- This app's bundled English text is New International Version (NIV) only. Do not recommend other translations as replacements inside the product.
- If the user asks about non-Bible topics, politely steer back to scripture understanding.
- Be concise (under ~220 words unless the user asks for depth). Warm, pastoral tone without judging the user's motives.

Reminder: Production builds may include placeholder scripture until NIV licensing is finalized—keep explanations faithful to mainstream evangelical understanding regardless.`;

/**
 * Proxies Bible-only chat to OpenAI. Requires OPENAI_API_KEY on the server.
 * Never expose API keys to the mobile bundle—clients call this endpoint with a Supabase JWT.
 */
@Controller()
@UseGuards(SupabaseAuthGuard)
export class BibleChatController {
  @Post("bible-chat")
  async bibleChat(@Body() body: unknown) {
    const parsed = parseChatBody(body);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Bible Chat is not configured on the server (missing OPENAI_API_KEY)."
      );
    }

    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const payload = {
      model,
      temperature: 0.55,
      max_tokens: 700,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...parsed.messages.map((message) => ({
        role: message.role,
        content: message.content
      }))]
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        typeof raw.error === "object" &&
        raw.error !== null &&
        "message" in raw.error &&
        typeof (raw.error as { message: unknown }).message === "string"
          ? (raw.error as { message: string }).message
          : "OpenAI request failed.";
      throw new ServiceUnavailableException(message);
    }

    const choices = raw.choices as unknown;
    const first =
      Array.isArray(choices) && choices.length > 0 ? (choices[0] as Record<string, unknown>) : null;
    const innerMessage = first?.message as Record<string, unknown> | undefined;
    const content = typeof innerMessage?.content === "string" ? innerMessage.content : "";

    if (!content.trim()) {
      throw new ServiceUnavailableException("Empty reply from language model.");
    }

    return { reply: content.trim() };
  }
}

function parseChatBody(body: unknown): { messages: ChatMessage[] } {
  if (!body || typeof body !== "object") {
    throw new BadRequestException("Invalid JSON body.");
  }
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) {
    throw new BadRequestException("`messages` must be an array.");
  }
  if (messages.length === 0 || messages.length > 24) {
    throw new BadRequestException("`messages` must contain between 1 and 24 turns.");
  }

  const normalized: ChatMessage[] = [];
  for (const entry of messages) {
    if (!entry || typeof entry !== "object") {
      throw new BadRequestException("Invalid message entry.");
    }
    const role = (entry as { role?: unknown }).role;
    const content = (entry as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") {
      throw new BadRequestException("Each message.role must be user or assistant.");
    }
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new BadRequestException("Each message.content must be a non-empty string.");
    }
    if (content.length > 6000) {
      throw new BadRequestException("Message too long.");
    }
    normalized.push({ role, content: content.trim() });
  }

  return { messages: normalized };
}
