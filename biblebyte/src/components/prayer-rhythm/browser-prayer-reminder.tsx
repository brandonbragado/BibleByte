"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

function wallTimeToParts(wallTime: string): { h: number; m: number } | null {
  const s = wallTime.trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

/** Next firing time using the user's **local** clock (matches Settings copy for web). */
export function msUntilNextLocalWallTime(wallTime: string): number {
  const parts = wallTimeToParts(wallTime);
  if (!parts) return 86_400_000;

  const now = new Date();
  const next = new Date(now);
  next.setHours(parts.h, parts.m, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

type Props = {
  reminderEnabled: boolean;
  /** `HH:MM` or `HH:MM:SS` from Postgres time */
  reminderWallTime: string | null;
};

/**
 * Best-effort browser Notification schedule when the user has enabled reminders.
 * Replenished each day via chained timeouts. Deep-links to /home?prayer=1&from=reminder.
 *
 * TODO[APNs_FCM]: Native apps should schedule OS-level alarms; this is a web placeholder.
 */
export function BrowserPrayerReminder({ reminderEnabled, reminderWallTime }: Props) {
  const [perm, setPerm] = useState<NotificationPermission | null>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : null
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wall = reminderWallTime?.slice(0, 5) ?? null;

  useEffect(() => {
    if (!reminderEnabled || !wall) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    function clearT() {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function scheduleNext() {
      clearT();
      const w = wall;
      if (!w) return;
      const ms = msUntilNextLocalWallTime(w);
      timeoutRef.current = setTimeout(() => {
        try {
          const n = new Notification("Biblebyte · Prayer rhythm", {
            body: "When you’re ready, open today’s rhythm—a quiet moment with God.",
            tag: "prayer-rhythm-daily",
          });
          n.onclick = () => {
            window.focus();
            const path = `${window.location.origin}/home?prayer=1&from=reminder`;
            window.location.href = path;
          };
        } catch {
          /* ignore */
        }
        scheduleNext();
      }, ms);
    }

    scheduleNext();
    return clearT;
  }, [reminderEnabled, wall]);

  if (!reminderEnabled || !wall) return null;
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  if (perm !== "granted") {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Your reminder time is saved for <span className="font-medium text-foreground">{wall}</span>{" "}
          (local). Allow a gentle browser nudge to open Prayer rhythm at that time—never required.
        </p>
        {perm !== "denied" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={async () => {
              const p = await Notification.requestPermission();
              setPerm(p);
            }}
          >
            Allow notifications
          </Button>
        ) : (
          <p className="mt-2 text-xs">Notifications are blocked in this browser—you can still use reminders manually.</p>
        )}
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      We’ll nudge at {wall} (local) when this tab’s browser allows it.{" "}
      <span className="text-muted-foreground/80">Native push replaces this on mobile (Tier 3).</span>
    </p>
  );
}
