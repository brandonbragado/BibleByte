"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HeartHandshake } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { PrayerRhythmClient } from "@/components/prayer-rhythm/prayer-rhythm-client";
import { Button } from "@/components/ui/button";
import { appShellMaxWidthClass } from "@/lib/ui/app-shell";
import { cn } from "@/lib/utils";

type Props = {
  reminderEnabled: boolean;
  reminderWallTime: string | null;
};

/** Preserve other home query keys (e.g. `welcome`) when closing the sheet. */
function homeHrefWithoutPrayerWidget(search: string): string {
  const p = new URLSearchParams(search);
  p.delete("prayer");
  p.delete("from");
  const q = p.toString();
  return q ? `/home?${q}` : "/home";
}

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Full-viewport sheet over Home. Opened via `/home?prayer=1` so browser **Back**
 * returns to plain Home; Escape, backdrop tap, and **Back** button call `replace`
 * to the same stripped URL (avoids empty history edge cases).
 */
export function PrayerRhythmHomeOverlay({ reminderEnabled, reminderWallTime }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const openFlag = searchParams.get("prayer") === "1";
  const fromReminder = searchParams.get("from") === "reminder";

  const close = useCallback(() => {
    const stripped = homeHrefWithoutPrayerWidget(searchParams.toString());
    if (pathname === "/home") {
      router.replace(stripped);
    } else {
      router.replace("/home");
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!openFlag) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openFlag, close]);

  const sheetDur = reduceMotion ? 0.05 : 0.5;
  const backdropDur = reduceMotion ? 0.05 : 0.32;

  return (
    <AnimatePresence>
      {openFlag ? (
        <motion.div
          key="prayer-rhythm-overlay"
          className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prayer-rhythm-sheet-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: backdropDur, ease: easeOut }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/75 backdrop-blur-sm"
            aria-label="Close prayer rhythm"
            onClick={close}
          />

          <motion.div
            className={cn(
              "relative z-10 mx-auto flex w-full max-h-[min(92dvh,56rem)] flex-col overflow-hidden rounded-t-3xl border border-border/80 bg-card shadow-soft sm:max-h-[min(88dvh,52rem)] sm:rounded-3xl",
              appShellMaxWidthClass
            )}
            initial={{ opacity: 0, scale: 0.88, y: 56 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 40 }}
            transition={{
              duration: sheetDur,
              ease: easeOut,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
              <div className="rounded-2xl bg-primary/12 p-2.5 text-primary">
                <HeartHandshake className="size-6" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/85">Prayer</p>
                <h2 id="prayer-rhythm-sheet-title" className="font-display text-xl font-semibold sm:text-2xl">
                  Prayer rhythm
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  One tap when you’ve prayed—your calendar fills in quietly. Missed days stay neutral.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={close}>
                Back
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-4 sm:px-5 sm:pb-8">
              <PrayerRhythmClient
                reminderEnabled={reminderEnabled}
                reminderWallTime={reminderWallTime}
                initialFromReminder={fromReminder}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
