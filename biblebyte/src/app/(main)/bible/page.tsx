import { BookOpen } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BiblePage() {
  return (
    <div className="space-y-6 pb-8 pt-4">
      <header className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/12 p-3 text-primary">
          <BookOpen className="size-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
            Bible
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Sacred reading space
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Phase 3 delivers book & chapter selectors, search, bookmarks, highlights, notes,
            listening mode, and distraction-free reading—with premium typography.
          </p>
        </div>
      </header>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Coming soon</CardTitle>
          <CardDescription>
            Architecture reserves navigation hooks for scripture payloads with licensing gates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-2xl bg-muted/60 ring-1 ring-border/60" />
        </CardContent>
      </Card>
    </div>
  );
}
