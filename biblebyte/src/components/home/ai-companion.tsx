"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { sendCompanionMessage } from "@/app/(main)/home/companion-actions";
import type { CompanionMessageRow } from "@/types/companion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CompanionAssistantContent, CompanionBlocks, CompanionUserContent } from "@/types/companion";

const chips = [
  "Anxiety",
  "Purpose",
  "Marriage",
  "Faith",
  "Prayer",
  "Forgiveness",
  "Wisdom",
  "Direction",
] as const;

const suggestions = [
  "Help me understand Romans 8",
  "What does God say about worry?",
  "Help me pray",
  "How do I forgive?",
  "I feel overwhelmed",
  "Help my marriage",
  "Build discipline",
  "Help me trust God",
];

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

function BlockReply({ reply }: { reply: CompanionBlocks }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-background/90 p-4 text-sm leading-relaxed shadow-inner">
      <section>
        <h4 className="font-semibold text-primary">Understanding</h4>
        <p className="mt-1 text-muted-foreground">{reply.understanding}</p>
      </section>
      <section>
        <h4 className="font-semibold text-primary">Scripture</h4>
        <p className="mt-1 text-muted-foreground">{reply.scripture}</p>
      </section>
      <section>
        <h4 className="font-semibold text-primary">Life application</h4>
        <p className="mt-1 text-muted-foreground">{reply.application}</p>
      </section>
      <section>
        <h4 className="font-semibold text-primary">Prayer prompt</h4>
        <p className="mt-1 text-muted-foreground">{reply.prayer}</p>
      </section>
    </div>
  );
}

type Props = {
  sessionId: string | null;
  messages: CompanionMessageRow[];
};

export function AiCompanionCard({ sessionId, messages }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function submit(custom?: string) {
    const text = (custom ?? prompt).trim();
    if (!text || !sessionId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await sendCompanionMessage(sessionId, text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPrompt("");
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-b from-card to-primary/[0.06] shadow-soft">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
      <CardHeader className="relative space-y-2">
        <Badge variant="gold" className="w-fit">
          BibleByte companion
        </Badge>
        <CardTitle className="font-display text-2xl">
          Ask BibleByte anything about scripture or life…
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Grounded in scripture, generous in tone—never claiming revelation, never replacing pastors or counselors.
          Your recent messages are sent with each question so follow-ups stay in context.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {!sessionId && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Companion session could not start. Confirm Supabase migrations (including chat tables) are applied, then refresh.
          </p>
        )}

        {messages.length > 0 && (
          <div className="max-h-[min(360px,50vh)] space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/25 p-3">
            {messages.map((m) => {
              if (m.role === "user" && isUserContent(m.content)) {
                return (
                  <div
                    key={m.id}
                    className="ml-4 rounded-xl border border-primary/15 bg-background/90 px-3 py-2 text-sm text-foreground"
                  >
                    {m.content.text}
                  </div>
                );
              }
              if (m.role === "assistant" && isAssistantContent(m.content)) {
                return (
                  <div key={m.id} className="space-y-1">
                    {m.content.demo && (
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        Demo reply (configure OPENAI_API_KEY for live model)
                      </p>
                    )}
                    <BlockReply reply={m.content.blocks} />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setPrompt(`Help me with ${c.toLowerCase()}`);
              }}
              className="rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
            >
              {c}
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Share what is on your heart…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[96px] bg-background/90"
          disabled={loading || !sessionId}
        />

        <Button
          type="button"
          className="w-full"
          disabled={loading || !prompt.trim() || !sessionId}
          onClick={() => submit()}
        >
          {loading ? "Listening…" : "Ask BibleByte"}
        </Button>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setPrompt(s);
                void submit(s);
              }}
              disabled={loading || !sessionId}
              className="rounded-xl bg-muted/80 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
