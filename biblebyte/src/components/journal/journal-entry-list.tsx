"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { JournalEntryKind, JournalEntryRow } from "@/types/journal";

const KIND_LABEL: Record<JournalEntryKind, string> = {
  reflection: "Reflection",
  gratitude: "Gratitude",
  insight: "Insight",
};

export function JournalEntryList({ entries }: { entries: JournalEntryRow[] }) {
  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl">Reflection journal</CardTitle>
        <CardDescription>
          Reflections, gratitude, and milestones—these sit alongside your Home daily reflection card when you want more depth here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recent entries ({entries.length})
        </p>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your insights will gather here.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-inner"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{KIND_LABEL[e.kind as JournalEntryKind]}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{e.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
