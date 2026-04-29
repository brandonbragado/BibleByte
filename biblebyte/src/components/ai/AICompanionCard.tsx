"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ChatInput } from "@/components/ai/ChatInput";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { PromptChips } from "@/components/ai/PromptChips";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiChatMessageDto } from "@/lib/ai/types";

function companionRequestErrorMessage(error: string | undefined, code: string | undefined): string {
  const trimmed = error?.trim();
  if (trimmed) return trimmed;

  switch (code) {
    case "ai_not_configured":
      return "AI isn’t configured yet. Add OPENAI_API_KEY to .env.local (see .env.example), then restart the dev server.";
    case "unauthorized":
      return "Sign in to use the companion — chat is only saved for signed-in users.";
    case "schema_outdated":
      return "Database needs migration 008 (AI chat messages). Run Supabase migrations, then try again.";
    default:
      return "Could not get a reply.";
  }
}

type Props = {
  initialSessionId: string | null;
  initialMessages: AiChatMessageDto[];
  /** Rotating quick prompts (e.g. from server using `getRotatingQuickPrompts()`). */
  quickPrompts: readonly string[];
};

export function AICompanionCard({ initialSessionId, initialMessages, quickPrompts }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [messages, setMessages] = useState<AiChatMessageDto[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const sendInFlightRef = useRef(false);

  const welcome = useMemo(
    () =>
      messages.length === 0
        ? "Ask about Scripture, prayer, or what you’re carrying today. Your thread saves while you’re signed in."
        : null,
    [messages.length]
  );

  /** Keep transcript scrolled to newest turn (user + assistant). */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  /** Sync from server only when session or stored message ids change (not on every new array reference). */
  const serverTranscriptKey = `${initialSessionId ?? "none"}|${initialMessages.map((m) => m.id).join("|")}`;
  useEffect(() => {
    setSessionId(initialSessionId);
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed by transcript identity only
  }, [serverTranscriptKey]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || sendInFlightRef.current) return;

    sendInFlightRef.current = true;
    setLoading(true);
    setError(null);

    const optimisticUser: AiChatMessageDto = {
      id: `local-${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId ?? undefined,
          message: trimmed,
        }),
      });

      const json = (await res.json()) as {
        sessionId?: string;
        message?: { role: string; content: string };
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        setError(companionRequestErrorMessage(json.error, json.code));
        return;
      }

      if (json.sessionId) {
        setSessionId(json.sessionId);
      }

      const assistantContent = json.message?.content?.trim();
      if (assistantContent) {
        const assistantMsg: AiChatMessageDto = {
          id: `local-a-${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }

      setDraft("");
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setError("Network error. Try again.");
    } finally {
      sendInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-b from-card to-primary/[0.06] shadow-soft">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
      <CardHeader className="relative space-y-2">
        <Badge variant="gold" className="w-fit">
          BibleByte AI
        </Badge>
        <CardTitle className="font-display text-2xl">Companion chat</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Scripture-grounded, humble, and practical—never replacing pastors or counselors. This space is for the Bible,
          faith, prayer, and spiritual life; off-topic questions are kindly redirected. Your last messages stay in
          context for follow-ups.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {welcome && (
          <p className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {welcome}
          </p>
        )}

        <div
          className="flex max-h-[min(360px,50vh)] min-h-[8.5rem] flex-col rounded-2xl border border-border/60 bg-muted/25"
          aria-label="AI companion conversation"
        >
          <p className="border-b border-border/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conversation
          </p>
          <div
            className="flex-1 space-y-4 overflow-y-auto p-3"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 && !loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No messages yet — use a quick prompt or type below. Replies appear here in order.
              </p>
            ) : (
              messages.map((m) => <ChatMessage key={m.id} message={m} />)
            )}
            {loading && (
              <p className="text-center text-xs text-muted-foreground" aria-busy="true">
                Thinking…
              </p>
            )}
            <div ref={logEndRef} aria-hidden className="h-px shrink-0" />
          </div>
        </div>

        <PromptChips
          prompts={quickPrompts}
          disabled={loading}
          onPick={(p) => {
            setDraft(p);
            void send(p);
          }}
        />

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={() => send(draft)}
          loading={loading}
          disabled={false}
        />

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
