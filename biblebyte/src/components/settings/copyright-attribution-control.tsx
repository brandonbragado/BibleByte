"use client";

import { useEffect, useState } from "react";
import { Copyright, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { COPYRIGHT_MODAL_SECTIONS } from "@/lib/legal/copyright-disclosures";
import { appShellMaxWidthClass } from "@/lib/ui/app-shell";
import { cn } from "@/lib/utils";

/**
 * Settings: small button that opens a read-only summary of copyright / third-party sources.
 */
export function CopyrightAttributionControl() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <Copyright className="size-3.5" aria-hidden />
        Copyright &amp; sources
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="copyright-attribution-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close copyright information"
            onClick={() => setOpen(false)}
          />

          <div
            className={cn(
              "relative z-10 mx-auto flex max-h-[min(92dvh,36rem)] w-full flex-col overflow-hidden rounded-t-3xl border border-border/80 bg-card shadow-soft sm:max-h-[min(88dvh,32rem)] sm:rounded-2xl",
              appShellMaxWidthClass
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
              <div>
                <h2 id="copyright-attribution-title" className="font-display text-lg font-semibold">
                  Copyright &amp; sources
                </h2>
                <p className="text-xs text-muted-foreground">
                  How BibleByte uses scripture text, AI, and placeholders.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {COPYRIGHT_MODAL_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h3 className="font-display text-sm font-semibold text-foreground">{section.title}</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {section.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
              <p className="text-[11px] leading-relaxed text-muted-foreground/90">
                TODO[NIV_LICENSE]: Have counsel review this panel before production release; replace or extend with
                publisher-approved notices.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
