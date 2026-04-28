"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ScriptureAttribution } from "@/components/scripture/scripture-attribution";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScripturePassagePayload } from "@/lib/scripture/types";

type Props = { passageId: string };

function PassageSkeleton({ passageId }: { passageId: string }) {
  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardDescription className="font-mono text-[11px] break-all">id: {passageId}</CardDescription>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function PassageReaderClient({ passageId }: Props) {
  const [data, setData] = useState<ScripturePassagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/scripture/passages?passageId=${encodeURIComponent(passageId)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as { data?: ScripturePassagePayload; error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "Could not load this passage.");
        }
        if (!cancelled) setData(json.data ?? null);
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
  }, [passageId]);

  if (loading) {
    return <PassageSkeleton passageId={passageId} />;
  }

  if (error) {
    return (
      <Card className="border-destructive/30 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl text-destructive">Couldn&apos;t load passage</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/bible">Back to Bible</Link>
          </Button>
          <p className="w-full text-xs text-muted-foreground">
            Search results link here using the verse id from API.Bible. If the id format is wrong, open the
            chapter from the book list instead.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-primary/12 shadow-soft">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No passage payload returned.
        </CardContent>
      </Card>
    );
  }

  const emptyVerses = data.verses.length === 0;

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="font-display text-xl">{data.reference}</CardTitle>
            <CardDescription className="mt-1 font-mono text-[11px] break-all">
              passageId: {data.passageId}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/bible">All books</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 font-serif text-[1.05rem] leading-[1.75] text-foreground/95">
        {emptyVerses ? (
          <p className="text-sm text-muted-foreground">
            No verses parsed from this passage HTML — try opening the full chapter from the canon index.
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
  );
}
