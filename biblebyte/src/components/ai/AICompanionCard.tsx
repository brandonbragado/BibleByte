"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ChatInput } from "@/components/ai/ChatInput";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { PromptChips } from "@/components/ai/PromptChips";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiChatMessageDto } from "@/lib/ai/types";

const QUICK_PROMPTS = [
  "I feel anxious",
  "Help me pray",
  "Explain this verse",
  "What does God say about forgiveness?",
  "Help me build discipline",
  "I need direction",
  "Help my relationship with God",
] as const;

type Props = {
  initialSessionId: string | null;
  initialMessages: AiChatMessageDto[];
};

export function AICompanionCard({ initialSessionId, initialMessages }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [messages, setMessages] = useState<AiChatMessageDto[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const welcome = useMemo(
    () =>
      messages.length === 0
        ? "Ask about Scripture, prayer, or what you’re carrying today. Your thread saves while you’re signed in."
        : null,
    [messages.length]
  );

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

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
        setError(json.error ?? "Could not get a reply.");
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
          Scripture-grounded, humble, and practical—never replacing pastors or counselors. Your last messages
          are included so follow-ups stay in context.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {welcome && (
          <p className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {welcome}
          </p>
        )}

        <div
          className="max-h-[min(360px,50vh)] space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/25 p-3"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {loading && (
            <p className="text-center text-xs text-muted-foreground" aria-busy="true">
              Thinking…
            </p>
          )}
        </div>

        <PromptChips
          prompts={QUICK_PROMPTS}
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
