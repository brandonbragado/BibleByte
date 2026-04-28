import { env } from "../constants/env";
import { supabase } from "./supabase/client";

export type BibleChatRole = "user" | "assistant";

export type BibleChatMessage = {
  role: BibleChatRole;
  content: string;
};

export type BibleChatResponse = {
  reply: string;
};

export function isBibleChatConfigured(): boolean {
  return Boolean(env.apiBaseUrl);
}

export async function sendBibleChatMessage(messages: BibleChatMessage[]): Promise<string> {
  if (!env.apiBaseUrl) {
    throw new Error(
      "Bible Chat is not configured. Set EXPO_PUBLIC_API_URL to your BibleByte API base URL."
    );
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sign in to use Bible Chat.");
  }

  const url = `${env.apiBaseUrl}/v1/bible-chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const raw = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(parseApiError(raw, response.status));
  }

  if (
    typeof raw === "object" &&
    raw !== null &&
    "reply" in raw &&
    typeof (raw as { reply: unknown }).reply === "string"
  ) {
    return (raw as BibleChatResponse).reply;
  }

  throw new Error("Unexpected response from Bible Chat.");
}

function parseApiError(raw: unknown, status: number): string {
  if (typeof raw !== "object" || raw === null || !("message" in raw)) {
    return `Chat request failed (${status}).`;
  }
  const message = (raw as { message: unknown }).message;
  if (typeof message === "string") {
    return message;
  }
  if (Array.isArray(message) && message.every((entry) => typeof entry === "string")) {
    return message.join(", ");
  }
  return `Chat request failed (${status}).`;
}
