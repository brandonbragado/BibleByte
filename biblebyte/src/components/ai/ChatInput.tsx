"use client";

import type { KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  loading,
  placeholder = "Share what’s on your heart…",
}: Props) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading && value.trim()) {
        onSend();
      }
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor="ai-chat-input" className="sr-only">
        Message to BibleByte AI
      </label>
      <Textarea
        id="ai-chat-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        className="min-h-[96px] resize-none bg-background/90"
        aria-busy={loading}
      />
      <Button
        type="button"
        className="w-full"
        disabled={disabled || loading || !value.trim()}
        onClick={onSend}
      >
        {loading ? "Listening…" : "Send"}
      </Button>
    </div>
  );
}
