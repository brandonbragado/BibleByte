"use client";

import { useTransition } from "react";

import { deletePrayer, updatePrayerStatus } from "@/app/(main)/journal/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PrayerRow, PrayerStatus } from "@/types/journal";

const STATUS_LABEL: Record<PrayerStatus, string> = {
  asked: "Asked",
  waiting: "Waiting",
  answered: "Answered",
};

function StatusBadge({ status }: { status: PrayerStatus }) {
  const variant =
    status === "answered" ? "default" : status === "waiting" ? "gold" : "sage";
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

export function PrayerList({ prayers }: { prayers: PrayerRow[] }) {
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, status: PrayerStatus) {
    startTransition(async () => {
      await updatePrayerStatus(id, status);
    });
  }

  function remove(id: string) {
    if (!confirm("Remove this prayer from your journal?")) {
      return;
    }
    startTransition(async () => {
      await deletePrayer(id);
    });
  }

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl">Prayer journal</CardTitle>
        <CardDescription>
          Carry requests from <strong>Asked</strong> → <strong>Waiting</strong> →{" "}
          <strong>Answered</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your prayers ({prayers.length})
        </p>
        {prayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet—add your first prayer above.
          </p>
        ) : (
          <ul className="space-y-4">
            {prayers.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <StatusBadge status={p.status} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() => remove(p.id)}
                  >
                    Remove
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{p.request}</p>
                {p.notes && (
                  <p className="mt-2 text-xs italic text-muted-foreground">Notes · {p.notes}</p>
                )}
                {p.answered_at && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Answered recorded ·{" "}
                    {new Date(p.answered_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["asked", "waiting", "answered"] as const).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={p.status === s ? "default" : "outline"}
                      disabled={pending || p.status === s}
                      onClick={() => setStatus(p.id, s)}
                    >
                      {STATUS_LABEL[s]}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
