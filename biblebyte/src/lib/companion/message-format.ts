import type {
  CompanionAssistantContent,
  CompanionMessageRow,
  CompanionUserContent,
} from "@/types/companion";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

function isUserContent(c: unknown): c is CompanionUserContent {
  return (
    typeof c === "object" &&
    c !== null &&
    (c as CompanionUserContent).kind === "user_text" &&
    typeof (c as CompanionUserContent).text === "string"
  );
}

function isAssistantContent(c: unknown): c is CompanionAssistantContent {
  return (
    typeof c === "object" &&
    c !== null &&
    (c as CompanionAssistantContent).kind === "structured" &&
    typeof (c as CompanionAssistantContent).blocks === "object"
  );
}

function formatAssistantBlocks(b: CompanionAssistantContent["blocks"]): string {
  return [
    `Understanding: ${b.understanding}`,
    `Scripture: ${b.scripture}`,
    `Application: ${b.application}`,
    `Prayer: ${b.prayer}`,
  ].join("\n");
}

/**
 * Maps persisted rows to OpenAI user/assistant messages (chronological).
 * Skips malformed rows so a bad row does not break the request.
 */
export function companionRowsToChatMessages(
  rows: CompanionMessageRow[]
): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [];
  for (const row of rows) {
    if (row.role === "user" && isUserContent(row.content)) {
      out.push({ role: "user", content: row.content.text });
    } else if (row.role === "assistant" && isAssistantContent(row.content)) {
      out.push({ role: "assistant", content: formatAssistantBlocks(row.content.blocks) });
    }
  }
  return out;
}
