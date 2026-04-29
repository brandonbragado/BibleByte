import { PenLine } from "lucide-react";

import { GuidedGrowthPathCard } from "@/components/home/guided-growth-path-card";
import { ReflectionCard } from "@/components/home/reflection-card";
import { JournalEntryCreateForm } from "@/components/journal/journal-entry-create-form";
import { JournalEntryList } from "@/components/journal/journal-entry-list";
import { PrayerCreateForm } from "@/components/journal/prayer-create-form";
import { PrayerList } from "@/components/journal/prayer-list";
import { utcTodayIsoDate } from "@/lib/date/utc-date";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntryRow, PrayerRow } from "@/types/journal";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  let prayers: PrayerRow[] = [];
  let entries: JournalEntryRow[] = [];

  if (user?.id) {
    const [prRes, jrRes] = await Promise.all([
      supabase
        .from("prayers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    prayers = (prRes.data ?? []) as PrayerRow[];
    entries = (jrRes.data ?? []) as JournalEntryRow[];
  }

  return (
    <div className="space-y-10 pb-10 pt-4">
      <header className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/12 p-3 text-primary">
          <PenLine className="size-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
            Journal
          </p>
          <h1 className="font-display text-fluid-page-title font-semibold">
            Prayer & reflection
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Prayers persist with lifecycle states; capture today’s intention here or on Home—it stays in sync.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <ReflectionCard
          key={reflectionRowId ?? `draft-${entryDate}`}
          initialBody={reflectionInitial}
          savedAtLabel={reflectionSavedLabel}
        />
        <GuidedGrowthPathCard />
      </div>

      <section className="space-y-6">
        <PrayerCreateForm />
        <PrayerList prayers={prayers} />
      </section>

      <section className="space-y-6">
        <JournalEntryCreateForm />
        <JournalEntryList entries={entries} />
      </section>
    </div>
  );
}
