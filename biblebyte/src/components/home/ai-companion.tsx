"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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

type ChatBlock = {
  understanding: string;
  scripture: string;
  application: string;
  prayer: string;
};

export function AiCompanionCard() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<ChatBlock | null>(null);

  async function submit(custom?: string) {
    const text = (custom ?? prompt).trim();
    if (!text) {
      return;
    }
    setLoading(true);
    setReply(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Request failed");
      }
      setReply(data.blocks as ChatBlock);
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Try again shortly.");
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
        </CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
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
        />

        <Button
          type="button"
          className="w-full"
          disabled={loading || !prompt.trim()}
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
              className="rounded-xl bg-muted/80 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {reply && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-2xl border border-border/70 bg-background/90 p-5 text-sm leading-relaxed shadow-inner"
          >
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
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
