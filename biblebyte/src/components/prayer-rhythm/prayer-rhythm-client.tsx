"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import {
  loadPrayerRhythmState,
  logPrayerReminderDeepLink,
  markPrayerToday,
  updatePrayerNoteForDay,
  type PrayerRhythmStateDto,
} from "@/app/(main)/prayer-rhythm/actions";
import { BrowserPrayerReminder } from "@/components/prayer-rhythm/browser-prayer-reminder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { monthGrid } from "@/lib/prayer-rhythm/dates";
import {
  browserLocalTodayYmd,
  browserLocalYearMonth,
  shiftMonthYm,
} from "@/lib/prayer-rhythm/local-today";
import { cn } from "@/lib/utils";

type Props = {
  reminderEnabled: boolean;
  reminderWallTime: string | null;
  initialFromReminder: boolean;
};

function monthTitle(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function PrayerRhythmClient({
  reminderEnabled,
  reminderWallTime,
  initialFromReminder,
}: Props) {
  const [ym, setYm] = useState(() => browserLocalYearMonth());
  const [state, setState] = useState<PrayerRhythmStateDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  const localToday = useMemo(() => browserLocalTodayYmd(), []);
  const [year, monthNum] = ym.split("-").map(Number);
  const weeks = useMemo(() => monthGrid(year, monthNum), [year, monthNum]);

  const checkMap = useMemo(() => {
    const m = new Map<string, { logged_at: string; note: string | null }>();
    for (const row of state?.checkIns ?? []) {
      m.set(row.local_date, { logged_at: row.logged_at, note: row.note });
    }
    return m;
  }, [state?.checkIns]);

  const refresh = useCallback(
    (nextYm: string) => {
      startTransition(async () => {
        setError(null);
        const res = await loadPrayerRhythmState({
          localToday,
          monthYm: nextYm,
        });
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setState(res);
        setHydrated(true);
      });
    },
    [localToday]
  );

  useEffect(() => {
    refresh(ym);
  }, [ym, refresh]);

  useEffect(() => {
    if (!initialFromReminder) return;
    let cancelled = false;
    void (async () => {
      await logPrayerReminderDeepLink();
      if (!cancelled) setToast("Glad you’re here—that’s what matters.");
    })();
    const t = setTimeout(() => setToast(null), 4500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [initialFromReminder]);

  function onMarkToday() {
    startTransition(async () => {
      setError(null);
      const res = await markPrayerToday({ localToday });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      if (res.milestone) {
        setToast(
          res.milestone === 7
            ? "A full week of showing up—beautiful consistency."
            : res.milestone === 14
              ? "Two weeks—you’re building something steady."
              : res.milestone === 30
                ? "A month of quiet faithfulness."
                : "Ninety days—deep roots."
        );
        setTimeout(() => setToast(null), 5000);
      }
      refresh(ym);
    });
  }

  const todayRow = state ? state.todayChecked : false;
  const selectedInfo = selectedYmd ? checkMap.get(selectedYmd) : undefined;

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className="flex items-start gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>{toast}</p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Today</CardTitle>
          <CardDescription>
            {!hydrated
              ? "Gathering your rhythm…"
              : todayRow
                ? "Today is marked. However today felt—this space stays gentle."
                : "You’re here—that’s what matters."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hydrated ? (
            <p className="text-sm text-muted-foreground">Loading today…</p>
          ) : todayRow ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">Today ✓</p>
              <p className="text-sm text-muted-foreground">
                Pick up where you left off whenever you need—there’s no scoreboard, only rhythm.
              </p>
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={onMarkToday}
            >
              I prayed today
            </Button>
          )}

          {hydrated && todayRow && (
            <details className="group rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                Add a thought? (optional)
              </summary>
              <form
                className="mt-3 space-y-2"
                action={async (fd) => {
                  const note = String(fd.get("note") ?? "");
                  await updatePrayerNoteForDay({ localDate: localToday, note });
                  refresh(ym);
                }}
              >
                <textarea
                  name="note"
                  rows={2}
                  maxLength={2000}
                  defaultValue={checkMap.get(localToday)?.note ?? ""}
                  placeholder="One line is enough…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                  Save note
                </Button>
              </form>
            </details>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display text-xl">Your month</CardTitle>
            <CardDescription>Each day is neutral until you mark it—no missed-day marks.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Previous month"
              onClick={() => setYm((y) => shiftMonthYm(y, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[10rem] text-center text-sm font-semibold text-foreground">
              {monthTitle(ym)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Next month"
              onClick={() => setYm((y) => shiftMonthYm(y, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid gap-1.5">
            {weeks.map((row, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {row.map((cell) => {
                  const hit = checkMap.has(cell.ymd);
                  const isToday = cell.ymd === localToday;
                  return (
                    <button
                      key={`${cell.ymd}-${wi}`}
                      type="button"
                      disabled={!cell.inMonth && !hit}
                      onClick={() => setSelectedYmd(cell.ymd)}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center rounded-xl border text-xs font-medium transition-colors",
                        !cell.inMonth && "opacity-40",
                        isToday && "ring-2 ring-primary/60",
                        hit
                          ? "border-primary/35 bg-primary/15 text-foreground"
                          : "border-border/50 bg-muted/15 text-muted-foreground"
                      )}
                    >
                      <span>{cell.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {state && (
            <div className="flex flex-wrap gap-4 border-t border-border/60 pt-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Current rhythm
                </p>
                <p className="text-lg font-semibold text-foreground">{state.currentStreak} days</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Best stretch
                </p>
                <p className="text-lg font-semibold text-foreground">{state.bestStreak} days</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Days marked (all time)
                </p>
                <p className="text-lg font-semibold text-foreground">{state.totalDays}</p>
              </div>
            </div>
          )}

          {selectedYmd && (
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(selectedYmd + "T12:00:00").toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {selectedInfo ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Logged ·{" "}
                      {new Date(selectedInfo.logged_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Not marked—empty days stay neutral.</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedYmd(null)}>
                  Close
                </Button>
              </div>
              {selectedInfo?.note && (
                <p className="mt-3 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  {selectedInfo.note}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <BrowserPrayerReminder reminderEnabled={reminderEnabled} reminderWallTime={reminderWallTime} />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
          Settings → Experience
        </Link>{" "}
        for reminder time and analytics preferences.
      </p>
    </div>
  );
}
