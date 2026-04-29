"use client";

import { useEffect, useState } from "react";

import { ChevronDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Bible } from "@/lib/scripture/types";
import { cn } from "@/lib/utils";

type BiblesResponse = {
  data?: Bible[];
  activeBibleId?: string | null;
  error?: string;
  code?: string;
};

/**
 * Compact strip: active API.Bible edition for the reader/search on this page.
 * Book pickers use the fixed 66-book canon — no duplicate list from the API.
 */
export function BibleTranslationBar() {
  const [bibles, setBibles] = useState<Bible[] | null>(null);
  const [activeId, setActiveId] = useState<string | null | undefined>(undefined);
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
          throw new Error(json.error ?? "Could not load translation info.");
        }
        if (!cancelled) {
          setBibles(json.data ?? []);
          setActiveId(json.activeBibleId ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Request failed.");
          setBibles(null);
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
      <div className="border-b border-border/60 px-4 py-3">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-b border-border/60 bg-destructive/5 px-4 py-3 text-sm">
        <p className="font-medium text-destructive">Translation info unavailable</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{error}</p>
        <details className="mt-2 rounded-md border border-border/50 bg-background/60 px-2 py-1.5">
          <summary className="cursor-pointer text-xs font-medium text-foreground/80">
            For admins
          </summary>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Scripture library must be enabled on the server with a valid key and default edition.
            You can still browse books; chapter text may use another mode until this is fixed.
          </p>
        </details>
      </div>
    );
  }

  const list = bibles ?? [];
  const activeMeta = activeId ? list.find((b) => b.id === activeId) : undefined;

  const abbrLine = activeMeta
    ? [
        ...new Set(
          [activeMeta.abbreviationLocal, activeMeta.abbreviation].filter(
            (x): x is string => Boolean(x?.trim())
          )
        ),
      ].join(" · ")
    : "";

  return (
    <div className="border-b border-border/60 bg-muted/20">
      <div className="px-4 py-3 text-sm">
        {activeMeta ? (
          <>
            <p className="text-foreground">
              <span className="text-muted-foreground">Reading in </span>
              <span className="font-semibold">{activeMeta.name}</span>
              {abbrLine ? (
                <span className="text-muted-foreground">
                  {" "}
                  · {abbrLine}
                  {activeMeta.language?.name ? ` · ${activeMeta.language.name}` : null}
                </span>
              ) : activeMeta.language?.name ? (
                <span className="text-muted-foreground"> · {activeMeta.language.name}</span>
              ) : null}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Text is loaded on BibleByte&apos;s servers for this translation. Pick any book in the
              sections below.
            </p>
            <details className="bb-disclosure mt-2">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground",
                  "[&::-webkit-details-marker]:hidden"
                )}
              >
                <ChevronDown className="bb-disclosure-chevron size-3.5 shrink-0" aria-hidden />
                Edition id &amp; other translations
              </summary>
              <div className="mt-2 space-y-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-xs">
                <p className="break-all font-mono text-[11px] leading-snug text-muted-foreground">
                  {activeMeta.id}
                </p>
                {list.length > 1 ? (
                  <div>
                    <p className="font-medium text-foreground/85">
                      Also available with this app ({list.length} total)
                    </p>
                    <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto text-muted-foreground">
                      {list.map((b) => (
                        <li key={b.id} className="truncate">
                          <span className="text-foreground/80">{b.name}</span>
                          {b.abbreviation ? (
                            <span className="text-muted-foreground"> · {b.abbreviation}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Switching the default is done in server configuration.
                    </p>
                  </div>
                ) : null}
              </div>
            </details>
          </>
        ) : activeId ? (
          <p className="text-muted-foreground">
            Active translation id isn&apos;t in the catalog response. Refresh the page or check the
            server configuration.
          </p>
        ) : (
          <p className="text-muted-foreground">
            No default translation is configured yet. Books below still match the standard 66-book
            Bible; chapter text depends on server setup.
          </p>
        )}
      </div>
    </div>
  );
}
