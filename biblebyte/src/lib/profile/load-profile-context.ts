import type { SupabaseClient } from "@supabase/supabase-js";

import { formatIsoDateUs } from "@/lib/date/utc-date";
import { getBookByCode } from "@/lib/bible/canon";
import type { ProfileStats } from "@/lib/profile/load-stats";

export type ProfileReadingSnippet = {
  label: string;
  href: string;
};

export type ProfileJournalSnippet = {
  kind: string;
  dateLabel: string;
  preview: string;
};

export type OnboardingHighlights = {
  growthFocus: string | null;
  dailyMinutes: string | null;
  season: string | null;
  learningStyle: string | null;
};

function parseOnboardingHighlights(raw: unknown): OnboardingHighlights {
  if (!raw || typeof raw !== "object") {
    return { growthFocus: null, dailyMinutes: null, season: null, learningStyle: null };
  }
  const o = raw as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === "string" ? o[k].trim() || null : null);
  return {
    growthFocus: s("growth_focus"),
    dailyMinutes: s("daily_minutes"),
    season: s("season"),
    learningStyle: s("learning_style"),
  };
}

function truncatePreview(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Friendly line when streak / month activity is strong — no shaming when null. */
export function profileEncouragementLine(stats: ProfileStats): string | null {
  if (stats.streakDays >= 14) {
    return "Two weeks of showing up—your rhythm is taking root.";
  }
  if (stats.streakDays >= 7) {
    return "A full week of engagement—steady and worth celebrating.";
  }
  if (stats.activityDaysThisUtcMonth >= 5) {
    return "You’ve touched BibleByte on several days this month—gentle consistency adds up.";
  }
  return null;
}

export type ProfileContextSnippets = {
  reading: ProfileReadingSnippet | null;
  journal: ProfileJournalSnippet | null;
  lastPrayerDate: string | null;
  onboarding: OnboardingHighlights;
};

export async function loadProfileContextSnippets(
  supabase: SupabaseClient,
  userId: string,
  onboardingData: unknown
): Promise<ProfileContextSnippets> {
  const onboarding = parseOnboardingHighlights(onboardingData);

  const [posRes, journalRes, prayerRes] = await Promise.all([
    supabase.from("reading_positions").select("book_code, chapter, verse").eq("user_id", userId).maybeSingle(),
    supabase
      .from("journal_entries")
      .select("kind, body, entry_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("prayer_check_ins")
      .select("local_date")
      .eq("user_id", userId)
      .order("local_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let reading: ProfileReadingSnippet | null = null;
  const pos = posRes.data;
  if (pos?.book_code) {
    const b = getBookByCode(pos.book_code);
    if (b) {
      const label =
        pos.verse > 1 ? `${b.name} ${pos.chapter}:${pos.verse}` : `${b.name} ${pos.chapter}`;
      reading = { label, href: `/bible/${b.code}/${pos.chapter}` };
    }
  }

  let journal: ProfileJournalSnippet | null = null;
  const jr = journalRes.data;
  if (jr?.body) {
    const kind = typeof jr.kind === "string" ? jr.kind : "reflection";
    const dateStr = typeof jr.entry_date === "string" ? jr.entry_date : "";
    journal = {
      kind,
      dateLabel: dateStr ? formatIsoDateUs(dateStr) : "Recently",
      preview: truncatePreview(String(jr.body), 100),
    };
  }

  const lastPrayer =
    !prayerRes.error && prayerRes.data?.local_date
      ? String(prayerRes.data.local_date).slice(0, 10)
      : null;

  return { reading, journal, lastPrayerDate: lastPrayer, onboarding };
}
