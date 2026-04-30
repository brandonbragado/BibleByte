import Link from "next/link";
import { Suspense } from "react";

import { AICompanionCard } from "@/components/ai/AICompanionCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DailyVerseCard, type LiveDailyScripture } from "@/components/home/daily-verse-card";
import { PrayerRhythmHomeOverlay } from "@/components/prayer-rhythm/prayer-rhythm-home-overlay";
import { PrayerRhythmMiniPreview } from "@/components/prayer-rhythm/prayer-rhythm-mini-preview";
import { PrayerRhythmMiniPreviewSkeleton } from "@/components/prayer-rhythm/prayer-rhythm-mini-preview-skeleton";
import { HomeGreeting } from "@/components/home/home-greeting";
import { HomePageEntrance } from "@/components/home/home-page-entrance";
import {
  homeDailyVerseUseScriptureApi,
} from "@/config/scripture";
import { getFallbackDailyVerseForDate } from "@/lib/bible/daily-verse-fallback";
import { parseDailyVerseReference } from "@/lib/bible/parse-daily-reference";
import { getBookByCode } from "@/lib/bible/canon";
import {
  buildContinueReadingContextBlurb,
  buildContinueReadingExcerpt,
} from "@/lib/bible/continue-reading-excerpt";
import { formatIsoDateUs, utcTodayIsoDate } from "@/lib/date/utc-date";
import type { AiChatMessageDto } from "@/lib/ai/types";
import { loadHomeAiChatState } from "@/lib/ai/chat-service";
import { getRotatingQuickPrompts } from "@/lib/ai/quick-prompts";
import { resolveGreetingFirstName } from "@/lib/profile/greeting-name";
import { loadChapterFromApiBible } from "@/lib/scripture/scripture-service";
import { createClient } from "@/lib/supabase/server";

function wallClockLabel(raw: unknown): string | null {
  if (raw == null) return null;
  const s = typeof raw === "string" ? raw : String(raw);
  return s.slice(0, 5);
}

type Props = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const playWelcomeEntrance = sp.welcome === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "display_name, first_name, reminder_enabled, reminder_wall_time"
    )
    .maybeSingle();

  const displayFirst = resolveGreetingFirstName(profile, user?.email);

  const reminderWall = wallClockLabel(profile?.reminder_wall_time);
  const reminderWallTimeRaw = profile?.reminder_wall_time
    ? String(profile.reminder_wall_time).slice(0, 8)
    : null;

  const entryDate = utcTodayIsoDate();
  const todayDisplay = formatIsoDateUs(entryDate);

  let aiChatSessionId: string | null = null;
  let aiChatMessages: AiChatMessageDto[] = [];
  if (user?.id) {
    const aiState = await loadHomeAiChatState(supabase, user.id);
    aiChatSessionId = aiState.sessionId;
    aiChatMessages = aiState.messages;
  }

  /** Stable per user — do not include message ids, or refresh remounts the card and the transcript scroll jumps to top. */
  const aiCompanionKey = [user?.id ?? "anon"].join(":");

  let continueReadingLabel: string | null = null;
  let continueReadingHref: string | null = null;
  let continueReadingExcerpt: string | null = null;
  let continueReadingContextBlurb: string | null = null;

  if (user?.id) {
    const { data: pos } = await supabase
      .from("reading_positions")
      .select("book_code, chapter, verse")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pos?.book_code) {
      const b = getBookByCode(pos.book_code);
      if (b) {
        continueReadingLabel =
          pos.verse > 1
            ? `${b.name} ${pos.chapter}:${pos.verse}`
            : `${b.name} ${pos.chapter}`;
        continueReadingHref = `/bible/${b.code}/${pos.chapter}`;
        continueReadingContextBlurb = buildContinueReadingContextBlurb(b, pos.chapter, pos.verse);

        if (homeDailyVerseUseScriptureApi()) {
          try {
            const ch = await loadChapterFromApiBible(pos.book_code, pos.chapter);
            if (!ch.isPlaceholder && ch.verses.length > 0) {
              continueReadingExcerpt = buildContinueReadingExcerpt(ch.verses, pos.verse, {
                maxChars: 320,
                neighborSpan: 1,
              });
            }
          } catch {
            /* keep excerpt null; context blurb still fills the card */
          }
        }
      }
    }
  }

  let dailyVerse: {
    reference: string;
    body_placeholder: string;
    attribution_note: string | null;
  };

  const { data: verseRow } = await supabase
    .from("daily_verses")
    .select("reference, body_placeholder, attribution_note")
    .eq("verse_date", entryDate)
    .maybeSingle();

  if (verseRow?.reference && verseRow.body_placeholder) {
    dailyVerse = {
      reference: verseRow.reference,
      body_placeholder: verseRow.body_placeholder,
      attribution_note: verseRow.attribution_note ?? null,
    };
  } else {
    dailyVerse = getFallbackDailyVerseForDate(entryDate);
  }

  let liveDailyScripture: LiveDailyScripture | null = null;
  if (homeDailyVerseUseScriptureApi()) {
    const loc = parseDailyVerseReference(dailyVerse.reference);
    if (loc) {
      try {
        const ch = await loadChapterFromApiBible(loc.bookCode, loc.chapter);
        const selected = ch.verses.filter(
          (v) => v.verseNumber >= loc.verseStart && v.verseNumber <= loc.verseEnd
        );
        const lines =
          selected.length > 0
            ? selected
            : ch.verses.filter((v) => v.verseNumber >= loc.verseStart).slice(0, 8);
        const body = lines.map((v) => `${v.verseNumber}. ${v.text}`).join("\n\n");
        if (body.trim()) {
          liveDailyScripture = {
            body,
            translationLabel: ch.attribution.translationLabel,
            detail: ch.attribution.detail,
            isPlaceholder: ch.isPlaceholder,
          };
        }
      } catch {
        liveDailyScripture = null;
      }
    }
  }

  let savedRefs: string[] = [];
  if (user?.id) {
    const { data: sv } = await supabase
      .from("saved_verses")
      .select("reference")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    savedRefs = (sv ?? []).map((r) => r.reference).filter(Boolean);
  }

  const reminderLines =
    user?.id && profile?.reminder_enabled && reminderWall
      ? `Reminder preference saved for ${reminderWall}—native notifications activate once Expo registers push tokens (Tier 3 placeholder).`
      : user?.id
        ? "Choose analytics + reminders under Settings → Experience (native scheduling ties in later)."
        : "Sign in to bookmark chapters and tune reminders.";

  const quickPrompts = getRotatingQuickPrompts();

  return (
    <HomePageEntrance playSlowEntrance={playWelcomeEntrance}>
      <Suspense fallback={null}>
        <PrayerRhythmHomeOverlay
          reminderEnabled={Boolean(profile?.reminder_enabled)}
          reminderWallTime={reminderWallTimeRaw}
        />
      </Suspense>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
          Today{" "}
          <time dateTime={entryDate} className="font-normal normal-case tracking-normal text-muted-foreground">
            · {todayDisplay}
          </time>
        </p>
        <HomeGreeting firstName={displayFirst} />
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground lg:max-w-3xl lg:text-lg lg:leading-relaxed">
          Everything here is tuned toward calm guidance—scripture first, kindness always.
        </p>
      </header>

      <DailyVerseCard verse={dailyVerse} liveScripture={liveDailyScripture} />

      <AICompanionCard
        key={aiCompanionKey}
        initialSessionId={aiChatSessionId}
        initialMessages={aiChatMessages}
        quickPrompts={quickPrompts}
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Continue reading</CardTitle>
            <CardDescription>Resume where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {continueReadingHref && continueReadingLabel ? (
              <>
                <p className="text-sm font-semibold text-foreground">{continueReadingLabel}</p>
                {continueReadingExcerpt ? (
                  <div className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2.5">
                    <p className="text-sm leading-relaxed text-foreground/95">{continueReadingExcerpt}</p>
                  </div>
                ) : continueReadingContextBlurb ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{continueReadingContextBlurb}</p>
                ) : null}
                <Button variant="default" size="sm" asChild>
                  <Link href={continueReadingHref}>Continue</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Open any chapter in the Bible tab—your place syncs here automatically.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/bible">Browse books</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Prayer reminder</CardTitle>
            <CardDescription>Gentle encouragement for daily connection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{reminderLines}</p>
            {user?.id ? (
              <Suspense fallback={<PrayerRhythmMiniPreviewSkeleton />}>
                <PrayerRhythmMiniPreview />
              </Suspense>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Saved verses preview</CardTitle>
          <CardDescription>Quick library access.</CardDescription>
        </CardHeader>
        <CardContent>
          {savedRefs.length > 0 ? (
            <ul className="space-y-2">
              {savedRefs.map((ref) => (
                <li key={ref} className="text-sm font-medium text-foreground">
                  {ref}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bookmark chapters from the Bible reader—they sync here automatically when signed in.
            </p>
          )}
        </CardContent>
      </Card>
    </HomePageEntrance>
  );
}
