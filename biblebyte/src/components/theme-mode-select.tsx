"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modes = [
  { id: "system" as const, label: "Match system", Icon: Monitor },
  { id: "light" as const, label: "Light theme", Icon: Sun },
  { id: "dark" as const, label: "Dark theme", Icon: Moon },
];

type Props = {
  /** Icon-only strip for tight headers (landing, login) */
  compact?: boolean;
};

export function ThemeModeSelect({ compact = false }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Client-only: next-themes has no SSR theme; avoids mismatched aria-pressed.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount gate for hydration
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl bg-muted/50",
          compact ? "h-9 w-[6.5rem]" : "h-11 w-full max-w-md"
        )}
        aria-hidden
      />
    );
  }

  const active = theme ?? "system";

  return (
    <div
      className={cn(
        "flex rounded-xl border border-border/70 bg-muted/30 p-1",
        compact ? "inline-flex" : "w-full max-w-md"
      )}
      role="group"
      aria-label="Color theme"
    >
      {modes.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-lg font-medium text-muted-foreground",
            compact ? "h-8 w-9 flex-none px-0" : "h-10 flex-1 gap-2 px-3",
            active === id && "bg-background text-foreground shadow-sm"
          )}
          onClick={() => setTheme(id)}
          aria-pressed={active === id}
          aria-label={label}
          title={label}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {!compact && (
            <span className="truncate">
              {id === "system" ? "System" : id === "light" ? "Light" : "Dark"}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
