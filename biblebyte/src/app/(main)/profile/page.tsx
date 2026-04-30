import Link from "next/link";

import { Sparkles } from "lucide-react";

import { ProfileIdentityForm } from "@/components/profile/profile-identity-form";
import { ProfileTimeGreeting } from "@/components/profile/profile-time-greeting";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatIsoDateUs } from "@/lib/date/utc-date";
import {
  loadProfileContextSnippets,
  profileEncouragementLine,
} from "@/lib/profile/load-profile-context";
import { resolveGreetingFirstName } from "@/lib/profile/greeting-name";
import { loadProfileStats } from "@/lib/profile/load-stats";
import { createClient } from "@/lib/supabase/server";

function humanizePreference(raw: string): string {
  const withoutPrefix = raw.replace(/^[^:]+:/, "");
  return withoutPrefix
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function humanizeJournalKind(kind: string): string {
  return humanizePreference(kind);
}

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
            <h1 className="font-display text-fluid-page-title font-semibold">Your spiritual milestones</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Sign in to see streaks and bookmark counts sourced from your journal and Bible activity.
            </p>
          </div>
        </header>
      </div>
    );
  }

  const stats = await loadProfileStats(supabase, user.id);

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select(
      "first_name, last_name, phone, display_name, spiritual_tags, onboarding_data, profile_bio, profile_monthly_focus"
    )
    .eq("id", user.id)
    .maybeSingle();

  const spiritualTags: string[] = profileRow?.spiritual_tags ?? [];

  const snippets = await loadProfileContextSnippets(
    supabase,
    user.id,
    profileRow?.onboarding_data ?? null
  );

  const encouragement = profileEncouragementLine(stats);
  const greetingFirst = resolveGreetingFirstName(profileRow, user.email ?? undefined);

  const onboardingGoalRows = [
    { label: "Growth focus", value: snippets.onboarding.growthFocus },
    { label: "Time with God", value: snippets.onboarding.dailyMinutes },
    { label: "Season", value: snippets.onboarding.season },
    { label: "Learning style", value: snippets.onboarding.learningStyle },
  ].filter((r) => r.value);

  const statTiles = [
    {
      label: "Showing up",
      value:
        stats.streakDays === 0
          ? "Start today"
          : `${stats.streakDays} ${stats.streakDays === 1 ? "day" : "days"}`,
      hint: "Days in a row you’ve opened the Word, journaled, or prayed in BibleByte.",
      titleHint:
        "Streak uses UTC calendar days. A day counts if you wrote a reflection, saved a journal entry, or created a prayer.",
    },
    {
      label: "Prayers marked answered",
      value: String(stats.prayersAnswered),
      hint: "Celebrate what you’ve seen God do—you marked these in your prayer list.",
      titleHint: "Count of prayers with status “answered” in your list.",
    },
    {
      label: "Verses you’ve saved",
      value: String(stats.versesSaved),
      hint: "Bookmarks from the Bible reader, ready when you need them.",
      titleHint: "Rows in saved_verses for your account.",
    },
    {
      label: "Journal entries",
      value: String(stats.journalEntries),
      hint: "Every reflection you’ve logged in Journal.",
      titleHint: "Total journal entry rows, all kinds.",
    },
  ];

  const monthFootnote = `${stats.activityDaysThisUtcMonth} active day${stats.activityDaysThisUtcMonth === 1 ? "" : "s"} this month (UTC)`;

  return (
    <div className="space-y-6 pb-8 pt-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="rounded-2xl bg-primary/12 p-3 text-primary shrink-0">
          <Sparkles className="size-7" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">Profile</p>
          <h1 className="font-display text-fluid-page-title font-semibold leading-tight">
            <ProfileTimeGreeting firstName={greetingFirst} />
          </h1>
          {profileRow?.profile_monthly_focus?.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/90">This month: </span>
              {profileRow.profile_monthly_focus.trim()}
            </p>
          ) : null}
          {profileRow?.profile_bio?.trim() ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/85">{profileRow.profile_bio.trim()}</p>
          ) : null}
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A calm snapshot of your BibleByte rhythm. We only use what you save here and the preferences you
            chose in onboarding—no hidden religious profiling.
          </p>
          {encouragement ? (
            <p className="mt-3 text-sm font-medium text-primary/95" role="status">
              {encouragement}
            </p>
          ) : null}
          <p
            className="mt-2 text-xs text-muted-foreground"
            title="Activity counts and streak use UTC dates to stay consistent across time zones."
          >
            {monthFootnote}
          </p>
        </div>
      </header>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Your rhythm, recently</CardTitle>
          <CardDescription>Based on where you last read, journaled, or checked in—not guesses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          {snippets.reading ? (
            <p>
              <span className="font-medium text-foreground">Reading: </span>
              <Link href={snippets.reading.href} className="font-medium text-primary underline-offset-4 hover:underline">
                {snippets.reading.label}
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground">
              No reading position yet—open the Bible reader and your spot will show here.
            </p>
          )}
          {snippets.journal ? (
            <p>
              <span className="font-medium text-foreground">Journal: </span>
              <span className="text-muted-foreground">
                Last {humanizeJournalKind(snippets.journal.kind)} · {snippets.journal.dateLabel}.{" "}
              </span>
              <span className="text-foreground">{snippets.journal.preview}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">No journal entries yet—when you write, a preview appears here.</p>
          )}
          {snippets.lastPrayerDate ? (
            <p>
              <span className="font-medium text-foreground">Prayer check-in: </span>
              <span className="text-muted-foreground">{formatIsoDateUs(snippets.lastPrayerDate)}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">
              No prayer rhythm logged yet—{" "}
              <Link href="/prayer-rhythm" className="font-medium text-primary underline-offset-4 hover:underline">
                open Prayer rhythm
              </Link>{" "}
              when you’re ready.
            </p>
          )}
        </CardContent>
      </Card>

      {onboardingGoalRows.length > 0 ? (
        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-xl">Goals you named</CardTitle>
            <CardDescription>From onboarding—only what you explicitly selected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {onboardingGoalRows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <span className="shrink-0 font-medium text-muted-foreground sm:w-36">{row.label}</span>
                <span className="text-foreground">{humanizePreference(row.value!)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Spiritual focus</CardTitle>
          <CardDescription>
            Topic chips from onboarding.{" "}
            <Link
              href="/onboarding?revisit=1"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Update preferences
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spiritualTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {spiritualTags.slice(0, 12).map((t) => (
                <Badge key={t} variant="sage">
                  {t.replace(/^[^:]+:/, "").replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tags yet—they’re added when you complete onboarding.{" "}
              <Link href="/onboarding?revisit=1" className="font-medium text-primary underline-offset-4 hover:underline">
                Set them up
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <ProfileIdentityForm
        email={user.email ?? ""}
        firstName={profileRow?.first_name ?? ""}
        lastName={profileRow?.last_name ?? ""}
        phone={profileRow?.phone ?? ""}
        profileBio={profileRow?.profile_bio ?? ""}
        profileMonthlyFocus={profileRow?.profile_monthly_focus ?? ""}
      />

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Highlights</CardTitle>
          <CardDescription>Numbers stay private to your account—exports stay opt-in under Settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              title={tile.titleHint}
              className="cursor-default rounded-xl border border-border/70 bg-muted/40 px-4 py-5 text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tile.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{tile.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tile.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Reminders, analytics, and data controls live in{" "}
        <Link href="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
