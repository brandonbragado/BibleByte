"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveTodayReflection } from "@/app/(main)/home/reflection-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initialBody: string;
  savedAtLabel?: string | null;
};

export function ReflectionCard({ initialBody, savedAtLabel }: Props) {
  const router = useRouter();
  const [text, setText] = useState(initialBody);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(() => text.trim() !== initialBody.trim(), [text, initialBody]);

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveTodayReflection(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.cleared ? "Cleared today’s reflection." : "Saved.");
      router.refresh();
    });
  }

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl">
          How can you apply this today?
        </CardTitle>
        <CardDescription>
          A tiny reflection carries weight—capture gratitude or intention.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Short note, gratitude, or intention for today…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[108px]"
          maxLength={4000}
          disabled={pending}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={pending || !dirty} onClick={() => save()}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending || !text.trim()}
            onClick={() => {
              setText("");
              startTransition(async () => {
                const result = await saveTodayReflection("");
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setMessage("Cleared today’s reflection.");
                router.refresh();
              });
            }}
          >
            Clear today
          </Button>
          <span className="text-xs text-muted-foreground">
            {text.length}/4000
          </span>
        </div>
        {savedAtLabel && (
          <p className="text-xs text-muted-foreground">{savedAtLabel}</p>
        )}
        {message && (
          <p className="text-xs font-medium text-primary" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
