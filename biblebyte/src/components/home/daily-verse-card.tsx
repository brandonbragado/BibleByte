import { ScriptureAttribution } from "@/components/scripture/scripture-attribution";
import { SCRIPTURE_DEFAULT_ATTRIBUTION, SCRIPTURE_TRANSLATION_LABEL } from "@/config/scripture";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const reference = verse?.reference ?? "Genesis 1:1 (fallback)";
  const body =
    liveScripture?.body ??
    verse?.body_placeholder ??
    "Placeholder devotional verse — run migration 004 and seed daily_verses in Supabase for rotating copy.";
  const note = verse?.attribution_note ?? SCRIPTURE_DEFAULT_ATTRIBUTION;
  const live = Boolean(liveScripture?.body);
  const attrLabel = live && liveScripture ? liveScripture.translationLabel : SCRIPTURE_TRANSLATION_LABEL;
  const attrDetail = live && liveScripture ? liveScripture.detail : note;
  const attrPlaceholder = live && liveScripture ? liveScripture.isPlaceholder : true;

  return (
    <Card className="overflow-hidden border-primary/15 shadow-soft">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/25 via-muted to-gold/15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35)_0%,transparent_55%)]" />
        <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-background/85 p-5 shadow-soft backdrop-blur-md md:inset-x-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Daily verse</p>
          {live ? (
            <p className="mt-2 text-[11px] font-medium text-primary/90" role="status">
              Loaded via API.Bible for today’s reference
            </p>
          ) : null}
          <p className="mt-3 font-display text-xl leading-snug text-foreground whitespace-pre-wrap">{body}</p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Reference · {reference}</p>
          <ScriptureAttribution
            className="mt-2 border-border/40"
            translationLabel={attrLabel}
            detail={attrDetail}
            isPlaceholder={attrPlaceholder}
            providerId={live ? "api_bible" : undefined}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" type="button" disabled title="Bookmarks ship next">
              Save
            </Button>
            <Button size="sm" variant="outline" type="button" disabled title="Sharing ships next">
              Share
            </Button>
            <Button size="sm" variant="ghost" type="button" disabled title="Audio ships next">
              Listen
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
