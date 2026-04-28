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
