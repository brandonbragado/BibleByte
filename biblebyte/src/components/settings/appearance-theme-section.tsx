"use client";

import { ThemeModeSelect } from "@/components/theme-mode-select";

export function AppearanceThemeSection() {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-4">
      <div>
        <p className="text-sm font-medium text-foreground">Appearance</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Same BibleByte palette and typography—choose light, dark, or match your device.
        </p>
      </div>
      <ThemeModeSelect />
    </div>
  );
}
