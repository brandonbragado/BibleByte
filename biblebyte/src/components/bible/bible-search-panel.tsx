"use client";

import { useCallback, useState } from "react";

import Link from "next/link";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SearchResult } from "@/lib/scripture/types";

type SearchResponse = {
  data?: {
    query: string;
    total: number;
    results: SearchResult[];
  };
  error?: string;
};

export function BibleSearchPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [emptyHint, setEmptyHint] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) {
      setError("Enter at least 2 characters.");
      setResults([]);
      setEmptyHint(null);
      return;
    }
    setLoading(true);
    setError(null);
    setEmptyHint(null);
    try {
      const res = await fetch(`/api/scripture/search?query=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as SearchResponse;
      if (!res.ok) {
        throw new Error(json.error ?? "Search failed.");
      }
      const list = json.data?.results ?? [];
      setResults(list);
      if (list.length === 0) {
        setEmptyHint(
          "No verses matched. Try other words, or confirm API.Bible NIV access is configured server-side."
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Search className="size-5 text-primary" strokeWidth={1.75} />
          Search scripture
        </CardTitle>
        <CardDescription>
          Queries your active Bible edition via BibleByte — never calls API.Bible from the browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. peace, love, Psalm 23"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
          />
          <Button type="button" onClick={() => void runSearch()} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {emptyHint && !error ? <p className="text-sm text-muted-foreground">{emptyHint}</p> : null}
        {results.length > 0 ? (
          <ul className="max-h-72 space-y-3 overflow-y-auto text-sm">
            {results.map((r, i) => {
              const passageKey = r.verseId ?? r.id;
              const href = passageKey
                ? `/bible/passage?passageId=${encodeURIComponent(passageKey)}`
                : null;
              const body = (
                <>
                  <p className="font-medium text-foreground">{r.reference}</p>
                  <p className="mt-1 text-muted-foreground line-clamp-3">{r.text}</p>
                  {href ? (
                    <p className="mt-2 text-xs font-medium text-primary">Open in passage reader →</p>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      No verse id from API — open the chapter from the book list.
                    </p>
                  )}
                </>
              );
              return (
                <li
                  key={`${r.reference}-${i}`}
                  className="rounded-xl border border-border/70 bg-muted/30 px-0 py-0 overflow-hidden"
                >
                  {href ? (
                    <Link
                      href={href}
                      className="block px-3 py-2 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="px-3 py-2">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Open a book from the lists below, or jump to{" "}
          <Link href="/bible/GEN/1" className="font-medium text-primary underline-offset-4 hover:underline">
            Genesis 1
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
