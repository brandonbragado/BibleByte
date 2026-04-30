"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { loadPrayerRhythmState } from "@/app/(main)/prayer-rhythm/actions";
import { monthGrid } from "@/lib/prayer-rhythm/dates";
import {
  browserLocalTodayYmd,
  browserLocalYearMonth,
} from "@/lib/prayer-rhythm/local-today";
import { cn } from "@/lib/utils";

function monthTitle(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/**
 * Compact month grid on Home; tap opens the full prayer rhythm sheet (`/home?prayer=1`).
 */
export function PrayerRhythmMiniPreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [, startTransition] = useTransition();

  const ym = useMemo(() => browserLocalYearMonth(), []);
  const localToday = useMemo(() => browserLocalTodayYmd(), []);
  const [year, monthNum] = ym.split("-").map(Number);
  const weeks = useMemo(() => monthGrid(year, monthNum), [year, monthNum]);

  const [checkSet, setCheckSet] = useState<Set<string> | null>(null);
  const [loadError, setLoadError] = useState(false);

  const fetchMonth = useCallback(() => {
    startTransition(async () => {
      const res = await loadPrayerRhythmState({ localToday, monthYm: ym });
      if ("error" in res) {
        setLoadError(true);
        setCheckSet(new Set());
        return;
      }
      setLoadError(false);
      setCheckSet(new Set(res.checkIns.map((c) => c.local_date)));
    });
  }, [localToday, ym]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  const prayerOpen = searchParams.get("prayer") === "1";
  useEffect(() => {
    if (prayerOpen) return;
    fetchMonth();
  }, [prayerOpen, fetchMonth]);

  function openSheet() {
    router.push("/home?prayer=1");
  }

  const tapTransition = reduceMotion ? { duration: 0.01 } : { duration: 0.2 };

  return (
    <motion.button
      type="button"
      onClick={openSheet}
      initial={false}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={tapTransition}
      className={cn(
        "group w-full rounded-2xl border border-primary/15 bg-muted/25 p-3 text-left outline-none transition-colors",
        "hover:border-primary/25 hover:bg-muted/35",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
      aria-label={`Open prayer rhythm — ${monthTitle(ym)}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold text-foreground">{monthTitle(ym)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-primary/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Expand
        </span>
      </div>

      <div className="grid grid-cols-7 gap-px text-center">
        {WEEK.map((d, i) => (
          <div
            key={`w-${i}`}
            className="pb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {weeks.flat().map((cell) => {
          const hit = checkSet?.has(cell.ymd) ?? false;
          const isToday = cell.ymd === localToday;
          return (
            <div
              key={cell.ymd}
              className={cn(
                "flex aspect-square min-h-0 max-h-7 items-center justify-center rounded-md text-[10px] font-medium",
                !cell.inMonth && "text-muted-foreground/35",
                cell.inMonth && !hit && "text-muted-foreground/60",
                hit && "bg-primary/20 text-foreground",
                isToday && "ring-1 ring-primary/60 ring-offset-1 ring-offset-transparent"
              )}
              aria-hidden
            >
              {cell.label}
            </div>
          );
        })}
      </div>

      {loadError && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Calendar could not load—{" "}
          <Link href="/home?prayer=1" className="font-medium text-primary underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>
            open prayer rhythm
          </Link>
          .
        </p>
      )}

      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Tap to open your rhythm—use device <span className="font-medium text-foreground/80">Back</span> to return.
      </p>
    </motion.button>
  );
}
