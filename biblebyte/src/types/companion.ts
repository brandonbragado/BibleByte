export type CompanionBlocks = {
  understanding: string;
  scripture: string;
  application: string;
  prayer: string;
};

export type CompanionUserContent = {
  kind: "user_text";
  text: string;
};

export type CompanionAssistantContent = {
  kind: "structured";
  blocks: CompanionBlocks;
  demo?: boolean;
};

/** Row loaded from Supabase `chat_messages` (+ session filter). */
export type CompanionMessageRow = {
  id: string;
  role: string;
  content: CompanionUserContent | CompanionAssistantContent | Record<string, unknown>;
  created_at: string;
};
