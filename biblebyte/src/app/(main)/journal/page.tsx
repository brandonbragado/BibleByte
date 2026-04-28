import { PenLine } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function JournalPage() {
  return (
    <div className="space-y-6 pb-8 pt-4">
      <header className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/12 p-3 text-primary">
          <PenLine className="size-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
            Journal
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Prayer & reflection
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Prayer requests with Asked → Waiting → Answered, plus reflections and gratitude streams—wired in Phase 3.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Prayer journal</CardTitle>
            <CardDescription>Requests, notes, answered milestones.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-36 rounded-xl bg-muted/70 ring-1 ring-border/60" />
          </CardContent>
        </Card>
        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Reflection journal</CardTitle>
            <CardDescription>Daily reflections & gratitude.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-36 rounded-xl bg-muted/70 ring-1 ring-border/60" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
