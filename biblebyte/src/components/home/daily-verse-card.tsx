import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { displayDailyVerseReference } from "@/lib/bible/parse-daily-reference";

export type DailyVersePayload = {
  reference: string;
  body_placeholder: string;
  attribution_note: string | null;
};

export type LiveDailyScripture = {
  body: string;
  translationLabel: string;
  detail: string;
  isPlaceholder: boolean;
};

type Props = {
  verse: DailyVersePayload | null;
  /** When API.Bible + env permit, server fills this from `daily_verses.reference`. */
  liveScripture?: LiveDailyScripture | null;
};

export function DailyVerseCard({ verse, liveScripture }: Props) {
  const referenceRaw = verse?.reference ?? "Genesis 1:1 (fallback)";
  const reference = displayDailyVerseReference(referenceRaw);
  const body =
    liveScripture?.body ??
    verse?.body_placeholder ??
    "Placeholder devotional verse — run migration 004 and seed daily_verses in Supabase for rotating copy.";

  return (
    <Card className="overflow-hidden border-primary/15 shadow-soft">
      <div className="relative h-[clamp(13rem,52vw,26rem)] max-h-[min(72vh,34rem)] min-h-[13rem] w-full bg-gradient-to-br from-primary/25 via-muted to-gold/15 sm:h-[clamp(14rem,42vw,28rem)] sm:max-h-[min(70vh,36rem)] sm:min-h-[14rem] lg:h-[clamp(15rem,36vw,30rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35)_0%,transparent_55%)]" />
        <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-background/85 p-4 text-center shadow-soft backdrop-blur-md sm:inset-x-6 sm:bottom-5 sm:p-5 md:inset-x-8 md:bottom-6 lg:inset-x-10 lg:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Daily verse</p>
          <p className="mx-auto mt-3 max-w-2xl font-display text-lg leading-snug text-foreground whitespace-pre-wrap sm:text-xl lg:text-[1.35rem]">
            {body}
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Reference · {reference}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" type="button" disabled title="Sharing ships next">
              Share
            </Button>
            <Button size="sm" variant="ghost" type="button" disabled title="Favorites ships next">
              Favorite
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
