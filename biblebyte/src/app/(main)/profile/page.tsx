import Link from "next/link";

import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadProfileStats } from "@/lib/profile/load-stats";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6 pb-8 pt-4">
        <header className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/12 p-3 text-primary">
            <Sparkles className="size-7" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">Profile</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Your spiritual milestones</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Sign in to see streaks and bookmark counts sourced from your journal and Bible activity.
            </p>
          </div>
        </header>
      </div>
    );
  }

  const stats = await loadProfileStats(supabase, user.id);

  const tiles = [
    {
      label: "Engagement streak",
      value:
        stats.streakDays === 0
          ? "Start today"
          : `${stats.streakDays} ${stats.streakDays === 1 ? "day" : "days"}`,
      hint: "UTC consecutive days with reflection, journal, or prayer activity.",
    },
    {
      label: "Prayers answered",
      value: String(stats.prayersAnswered),
      hint: "Marked answered in your prayer list.",
    },
    {
      label: "Verses saved",
      value: String(stats.versesSaved),
      hint: "Bookmarked chapters from the Bible reader.",
    },
    {
      label: "Journal entries",
      value: String(stats.journalEntries),
      hint: "Reflections logged under Journal.",
    },
  ];

  return (
    <div className="space-y-6 pb-8 pt-4">
      <header className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/12 p-3 text-primary">
          <Sparkles className="size-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">Profile</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your spiritual milestones</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Snapshot counts stay local to your account—analytics exports remain opt-in under Settings.
          </p>
        </div>
      </header>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Highlights</CardTitle>
          <CardDescription>Grounded in saved passages, prayers, and journal rhythm.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-xl border border-border/70 bg-muted/40 px-4 py-5 text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tile.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{tile.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tile.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Want finer-grained streak rules later?{" "}
        <Link href="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
          Tune reminders & analytics
        </Link>
        .
      </p>
    </div>
  );
}
