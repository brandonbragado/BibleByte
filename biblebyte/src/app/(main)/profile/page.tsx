import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="space-y-6 pb-8 pt-4">
      <header className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/12 p-3 text-primary">
          <Sparkles className="size-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
            Profile
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Your spiritual milestones
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Streaks, saved verses, devotionals completed, prayer answers—surfaced once analytics &
            persistence layers connect (Phase 4).
          </p>
        </div>
      </header>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Highlights preview</CardTitle>
          <CardDescription>Growth snapshots coming soon.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {["Reading streak", "Prayers answered", "Verses saved", "Paths begun"].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-border/70 bg-muted/40 px-4 py-6 text-center text-sm font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
