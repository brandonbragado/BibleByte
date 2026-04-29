export type ChatRole = "user" | "assistant" | "system";

/** Row from `chat_messages` after migration 008 (plain `content`). */
export type AiChatMessageRow = {
  id: string;
  session_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

export type AiChatApiRequest = {
  sessionId?: string | null;
  message: string;
};

export type AiChatApiResponse = {
  sessionId: string;
  message: {
    role: "assistant";
    content: string;
  };
};

/** Minimal row for UI lists (home load + optimistic updates). */
export type AiChatMessageDto = {
  id: string;
  role: Exclude<ChatRole, "system">;
  content: string;
  created_at: string;
};
