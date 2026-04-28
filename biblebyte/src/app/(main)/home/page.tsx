import Link from "next/link";

import { AiCompanionCard } from "@/components/home/ai-companion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

function greetingLabel() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayFirst = "Friend";
  if (user?.email) {
    const local = user.email.split("@")[0] ?? "";
    const chunk = local.split(/[._-]/)[0] ?? local;
    displayFirst =
      chunk.slice(0, 1).toUpperCase() + chunk.slice(1).toLowerCase();
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, spiritual_tags")
    .maybeSingle();

  if (profile?.display_name?.trim()) {
    displayFirst = profile.display_name.trim().split(/\s+/)[0] ?? displayFirst;
  }

  const tags: string[] = profile?.spiritual_tags ?? [];

  return (
    <div className="space-y-10 pb-8 pt-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
          Today
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          {greetingLabel()}, {displayFirst}
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Everything here is tuned toward calm guidance—scripture first, kindness always.
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {tags.slice(0, 6).map((t) => (
              <Badge key={t} variant="sage">
                {t.replace(/^[^:]+:/, "").replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Card className="overflow-hidden border-primary/15 shadow-soft">
        <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/25 via-muted to-gold/15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35)_0%,transparent_55%)]" />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-background/85 p-5 shadow-soft backdrop-blur-md md:inset-x-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Daily verse
            </p>
            <p className="mt-3 font-display text-xl leading-snug text-foreground">
              Placeholder devotional verse text—swap with licensed scripture once publisher agreements are in place.
            </p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Reference · Genesis 1:1 (placeholder)
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary">
                Save
              </Button>
              <Button size="sm" variant="outline">
                Share
              </Button>
              <Button size="sm" variant="ghost">
                Listen
              </Button>
              <Button size="sm" variant="ghost">
                Favorite
              </Button>
            </div>
          </div>
        </div>
      </Card>

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
          <Input placeholder="One sentence reflection…" disabled />
          <p className="text-xs text-muted-foreground">
            Saving reflections arrives with Phase 3 journaling persistence.
          </p>
        </CardContent>
      </Card>

      <AiCompanionCard />

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Guided growth path</CardTitle>
          <CardDescription>
            Personalized journeys—daily scripture, teaching, prayer, and reflection checkpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            "Anxiety & Peace",
            "Purpose & Direction",
            "Building Faith",
            "Forgiveness",
            "Marriage & Relationships",
          ].map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
          <p className="w-full pt-2 text-xs text-muted-foreground">
            Progress tracking wires up once persistence layers land—routing hooks are ready.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Continue reading</CardTitle>
            <CardDescription>Resume where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reader navigation arrives with Phase 3 Bible experience.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/bible">Open Bible tab</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Prayer reminder</CardTitle>
            <CardDescription>Gentle encouragement for daily connection.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notifications & reminders activate once scheduling policies are configured.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Saved verses preview</CardTitle>
          <CardDescription>Quick library access.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Saved passages surface here after bookmark persistence ships.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
