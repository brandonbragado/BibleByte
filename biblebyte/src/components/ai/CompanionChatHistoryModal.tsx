"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { ChatMessage } from "@/components/ai/ChatMessage";
import { Button } from "@/components/ui/button";
import { appShellMaxWidthClass } from "@/lib/ui/app-shell";
import { cn } from "@/lib/utils";
import type { AiChatMessageDto } from "@/lib/ai/types";

type Props = {
  open: boolean;
  onClose: () => void;
  messages: AiChatMessageDto[];
};

/** Full-thread readout; main panel stays short. */
export function CompanionChatHistoryModal({ open, onClose, messages }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="companion-chat-history-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Close chat history"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 mx-auto flex max-h-[min(92dvh,44rem)] w-full flex-col overflow-hidden rounded-t-3xl border border-border/80 bg-card shadow-soft sm:max-h-[min(88dvh,40rem)] sm:rounded-2xl",
          appShellMaxWidthClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
          <div>
            <h2 id="companion-chat-history-title" className="font-display text-lg font-semibold">
              Chat history
            </h2>
            <p className="text-xs text-muted-foreground">Everything saved for this thread, newest at the bottom.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4" role="log">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No messages in this thread yet.</p>
          ) : (
            messages.map((m) => <ChatMessage key={m.id} message={m} />)
          )}
        </div>
      </div>
    </div>
  );
}
