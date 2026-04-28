"use client";

import { useEffect, useState } from "react";

import { Library } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Bible, Book } from "@/lib/scripture/types";

type BiblesResponse = {
  data?: Bible[];
  activeBibleId?: string | null;
  error?: string;
  code?: string;
};

type BooksResponse = {
  data?: Book[];
  bibleId?: string;
  error?: string;
  code?: string;
};

export function BibleCatalogPanel() {
  const [bibles, setBibles] = useState<Bible[] | null>(null);
  const [activeId, setActiveId] = useState<string | null | undefined>(undefined);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [booksBibleId, setBooksBibleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/scripture/bibles", { cache: "no-store" });
        const json = (await res.json()) as BiblesResponse;
        if (!res.ok) {
          throw new Error(json.error ?? "Could not load Bible catalog.");
        }
        if (!cancelled) {
          setBibles(json.data ?? []);
          setActiveId(json.activeBibleId ?? null);
        }

        const active = json.activeBibleId?.trim();
        if (active) {
          const br = await fetch(`/api/scripture/books?bibleId=${encodeURIComponent(active)}`, {
            cache: "no-store",
          });
          const bj = (await br.json()) as BooksResponse;
          if (!br.ok) {
            if (!cancelled) setBooks([]);
            return;
          }
          if (!cancelled) {
            setBooks(bj.data ?? []);
            setBooksBibleId(bj.bibleId ?? active);
          }
        } else if (!cancelled) {
          setBooks([]);
          setBooksBibleId(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Catalog request failed.");
          setBibles(null);
          setBooks(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Library className="size-5 text-primary" strokeWidth={1.75} />
            Bible editions (API.Bible)
          </CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Set <code className="rounded bg-muted px-1">SCRIPTURE_PROVIDER_MODE=api_bible</code>,{" "}
            <code className="rounded bg-muted px-1">API_BIBLE_KEY</code>, and bible ids in{" "}
            <code className="rounded bg-muted px-1">.env.local</code> to load the catalog. Chapter
            reading still works in other modes via{" "}
            <code className="rounded bg-muted px-1">/api/scripture/chapters</code>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const list = bibles ?? [];
  const activeMeta = activeId ? list.find((b) => b.id === activeId) : undefined;

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Library className="size-5 text-primary" strokeWidth={1.75} />
          Active Bible edition
        </CardTitle>
        <CardDescription>
          Catalog from API.Bible through BibleByte — only when{" "}
          <code className="rounded bg-muted px-0.5 text-[0.8rem]">SCRIPTURE_PROVIDER_MODE=api_bible</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {activeMeta ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
            <p className="font-medium text-foreground">{activeMeta.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeMeta.abbreviation}
              {activeMeta.language?.name ? ` · ${activeMeta.language.name}` : null}
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/90 break-all">
              id: {activeMeta.id}
            </p>
          </div>
        ) : activeId ? (
          <p className="text-muted-foreground">
            Active id <span className="font-mono text-xs">{activeId}</span> not found in catalog response.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Could not resolve active Bible id — check{" "}
            <code className="rounded bg-muted px-1">API_BIBLE_DEFAULT_BIBLE_ID</code>.
          </p>
        )}

        {books && books.length > 0 ? (
          <div>
            <p className="mb-2 font-medium text-foreground">
              Books in this edition ({books.length})
              {booksBibleId ? (
                <span className="ml-1 font-normal text-muted-foreground">· {booksBibleId.slice(0, 8)}…</span>
              ) : null}
            </p>
            <ul className="max-h-48 overflow-y-auto rounded-xl border border-border/70 bg-muted/20 px-2 py-1 text-xs">
              {books.map((b) => (
                <li key={b.id} className="truncate border-b border-border/40 py-1.5 last:border-0">
                  <span className="font-medium text-foreground">{b.name}</span>
                  {b.abbreviation ? (
                    <span className="text-muted-foreground"> · {b.abbreviation}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : books && books.length === 0 && activeId ? (
          <p className="text-muted-foreground">No books returned for the active edition.</p>
        ) : null}

        {list.length > 1 ? (
          <details className="rounded-lg border border-border/60 bg-background/80 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              All {list.length} Bibles in API key scope
            </summary>
            <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {list.map((b) => (
                <li key={b.id} className="truncate">
                  {b.name} ({b.abbreviation})
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
