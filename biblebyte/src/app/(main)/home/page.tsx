import Link from "next/link";

import { loadHomeCompanionState } from "@/app/(main)/home/companion-actions";
import { AiCompanionCard } from "@/components/home/ai-companion";
import { ReflectionCard } from "@/components/home/reflection-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DailyVerseCard, type LiveDailyScripture } from "@/components/home/daily-verse-card";
import { HomeGreeting } from "@/components/home/home-greeting";
import {
  getScriptureProviderMode,
  homeDailyVerseUseScriptureApi,
} from "@/config/scripture";
import { parseDailyVerseReference } from "@/lib/bible/parse-daily-reference";
import { utcTodayIsoDate } from "@/lib/date/utc-date";
import { getBookByCode } from "@/lib/bible/canon";
import { loadChapterFromApiBible } from "@/lib/scripture/scripture-service";
import { createClient } from "@/lib/supabase/server";

function wallClockLabel(raw: unknown): string | null {
  if (raw == null) return null;
  const s = typeof raw === "string" ? raw : String(raw);
  return s.slice(0, 5);
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
    .select("display_name, spiritual_tags, reminder_enabled, reminder_wall_time")
    .maybeSingle();

  if (profile?.display_name?.trim()) {
    displayFirst = profile.display_name.trim().split(/\s+/)[0] ?? displayFirst;
  }

  const tags: string[] = profile?.spiritual_tags ?? [];
  const reminderWall = wallClockLabel(profile?.reminder_wall_time);

  const entryDate = utcTodayIsoDate();

  let reflectionInitial = "";
  let reflectionSavedLabel: string | null = null;
  let reflectionRowId: string | null = null;

  if (user?.id) {
    const { data: reflection } = await supabase
      .from("daily_reflections")
      .select("id, body")
      .eq("user_id", user.id)
      .eq("entry_date", entryDate)
      .maybeSingle();

    reflectionRowId = reflection?.id ?? null;

    if (reflection?.body) {
      reflectionInitial = reflection.body;
      reflectionSavedLabel = `Saved for calendar day ${entryDate} (UTC).`;
    }
  }

  const { sessionId: companionSessionId, messages: companionMessages } =
    await loadHomeCompanionState();

  let continueReadingLabel: string | null = null;
  let continueReadingHref: string | null = null;

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
      }
    }
  }

  let dailyVerse: {
    reference: string;
    body_placeholder: string;
    attribution_note: string | null;
  } | null = null;

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
  }

  let liveDailyScripture: LiveDailyScripture | null = null;
  if (
    homeDailyVerseUseScriptureApi() &&
    getScriptureProviderMode() === "api_bible" &&
    dailyVerse
  ) {
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

  return (
    <div className="space-y-10 pb-8 pt-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
          Today
        </p>
        <HomeGreeting firstName={displayFirst} />
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

      <DailyVerseCard verse={dailyVerse} liveScripture={liveDailyScripture} />

      <ReflectionCard
        key={reflectionRowId ?? `draft-${entryDate}`}
        initialBody={reflectionInitial}
        savedAtLabel={reflectionSavedLabel}
      />

      <AiCompanionCard
        sessionId={companionSessionId}
        messages={companionMessages}
      />

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
            Bible reading + companion chats now persist—guided path scoring comes next.
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
            {continueReadingHref && continueReadingLabel ? (
              <>
                <p className="text-sm font-medium text-foreground">{continueReadingLabel}</p>
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
          <CardContent>
            <p className="text-sm text-muted-foreground">{reminderLines}</p>
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
    </div>
  );
}
