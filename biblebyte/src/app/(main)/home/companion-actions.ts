"use server";

import { revalidatePath } from "next/cache";

import { generateCompanionBlocks } from "@/lib/companion/llm";
import { createClient } from "@/lib/supabase/server";
import type {
  CompanionAssistantContent,
  CompanionBlocks,
  CompanionUserContent,
} from "@/types/companion";

const HOME_SESSION_TITLE = "Home companion";

export type CompanionMessageRow = {
  id: string;
  role: string;
  content: CompanionUserContent | CompanionAssistantContent | Record<string, unknown>;
  created_at: string;
};

export type SendCompanionResult =
  | { ok: true; blocks: CompanionBlocks; demo: boolean }
  | { ok: false; error: string };

export async function loadHomeCompanionState(): Promise<{
  sessionId: string | null;
  messages: CompanionMessageRow[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { sessionId: null, messages: [] };
  }

  const { data: session, error: sessionErr } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("title", HOME_SESSION_TITLE)
    .maybeSingle();

  if (sessionErr) {
    console.error(sessionErr);
    return { sessionId: null, messages: [] };
  }

  let sessionId = session?.id ?? null;

  if (!sessionId) {
    const { data: created, error: insErr } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: HOME_SESSION_TITLE })
      .select("id")
      .single();

    if (insErr || !created?.id) {
      console.error(insErr);
      return { sessionId: null, messages: [] };
    }
    sessionId = created.id;
  }

  const { data: msgs, error: msgErr } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(40);

  if (msgErr) {
    console.error(msgErr);
    return { sessionId, messages: [] };
  }

  return {
    sessionId,
    messages: (msgs ?? []) as CompanionMessageRow[],
  };
}

export async function sendCompanionMessage(
  sessionId: string,
  prompt: string
): Promise<SendCompanionResult> {
  const text = prompt.trim();
  if (!text) {
    return { ok: false, error: "Message is empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: session, error: sessErr } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessErr || !session?.id) {
    return { ok: false, error: "Invalid companion session." };
  }

  const userPayload: CompanionUserContent = { kind: "user_text", text };

  const { error: userMsgErr } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: userPayload,
  });

  if (userMsgErr) {
    console.error(userMsgErr);
    return {
      ok: false,
      error:
        userMsgErr.message.includes("chat_messages") || userMsgErr.code === "42P01"
          ? "Run migrations through 003 in Supabase so chat tables exist."
          : "Could not save your message.",
    };
  }

  let blocks: CompanionBlocks;
  let demo: boolean;

  try {
    const result = await generateCompanionBlocks(text);
    blocks = result.blocks;
    demo = result.demo;
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Companion temporarily unavailable." };
  }

  const assistantPayload: CompanionAssistantContent = {
    kind: "structured",
    blocks,
    demo,
  };

  const { error: asstErr } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "assistant",
    content: assistantPayload,
  });

  if (asstErr) {
    console.error(asstErr);
    return { ok: false, error: "Could not save the companion reply." };
  }

  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  revalidatePath("/home");
  return { ok: true, blocks, demo };
}
