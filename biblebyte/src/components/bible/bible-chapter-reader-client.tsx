"use client";

import { useEffect, useState, type ReactNode } from "react";

import { ScriptureAttribution } from "@/components/scripture/scripture-attribution";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScriptureChapterPayload } from "@/lib/scripture/types";

type Props = {
  bookCode: string;
  bookName: string;
  chapter: number;
  headerExtra?: ReactNode;
  footerNav?: ReactNode;
};

function ChapterSkeleton({ bookName, chapter }: { bookName: string; chapter: number }) {
  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardDescription>
          {bookName} · Chapter {chapter}
        </CardDescription>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function BibleChapterReaderClient({
  bookCode,
  bookName,
  chapter,
  headerExtra,
  footerNav,
}: Props) {
  const [data, setData] = useState<ScriptureChapterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/scripture/chapters?book=${encodeURIComponent(bookCode)}&chapter=${chapter}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as ScriptureChapterPayload & {
          error?: string;
          code?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "Could not load this chapter.");
        }
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookCode, chapter]);

  if (loading) {
    return <ChapterSkeleton bookName={bookName} chapter={chapter} />;
  }

  if (error) {
    return (
      <Card className="border-destructive/30 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl text-destructive">Couldn&apos;t load chapter</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            For API.Bible mode, set <code className="rounded bg-muted px-1">API_BIBLE_KEY</code> and{" "}
            <code className="rounded bg-muted px-1">API_BIBLE_DEFAULT_BIBLE_ID</code> in{" "}
            <code className="rounded bg-muted px-1">.env.local</code>, and{" "}
            <code className="rounded bg-muted px-1">SCRIPTURE_PROVIDER_MODE=api_bible</code>. While you wait on API
            access, set{" "}
            <code className="rounded bg-muted px-1">API_BIBLE_PLACEHOLDER_ON_UPSTREAM_ERROR=true</code> to load mock
            chapters.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-primary/12 shadow-soft">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No chapter data returned.
        </CardContent>
      </Card>
    );
  }

  const emptyVerses = data.verses.length === 0;
  const showFallbackBanner = Boolean(data.upstreamFallback);

  return (
    <>
      {showFallbackBanner ? (
        <div
          className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          <p className="font-medium">Using placeholder text</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-50/90">
            {data.upstreamFallbackNote ??
              "API.Bible was unavailable — this chapter is mock copy until your key works."}
          </p>
        </div>
      ) : null}
      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Reading</CardTitle>
          <CardDescription>
            {bookName} · Chapter {chapter} — via BibleByte API (provider: {data.providerId}); the browser never
            calls API.Bible directly.
          </CardDescription>
          {headerExtra ? <div className="pt-2">{headerExtra}</div> : null}
        </CardHeader>
        <CardContent className="space-y-6 font-serif text-[1.05rem] leading-[1.75] text-foreground/95">
          {emptyVerses ? (
            <p className="text-sm text-muted-foreground">
              No verses parsed for this chapter — the upstream HTML shape may differ. Try another Bible
              edition id or report a parser gap. Reference: {data.reference ?? "—"}
            </p>
          ) : (
            data.verses.map((v) => (
              <p key={v.verseNumber} className="flex gap-3">
                <span className="select-none pt-0.5 font-sans text-xs font-semibold tabular-nums text-primary/75">
                  {v.verseNumber}
                </span>
                <span className="min-w-0">{v.text}</span>
              </p>
            ))
          )}
          <ScriptureAttribution
            translationLabel={data.attribution.translationLabel}
            detail={data.attribution.detail}
            isPlaceholder={data.isPlaceholder || emptyVerses}
            providerId={data.providerId}
          />
        </CardContent>
      </Card>
      {footerNav ? <div className="mt-4">{footerNav}</div> : null}
    </>
  );
}
