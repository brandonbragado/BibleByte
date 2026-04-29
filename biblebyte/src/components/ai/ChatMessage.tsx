import { AssistantMessageMarkdown } from "@/components/ai/assistant-markdown";
import { cn } from "@/lib/utils";
import type { AiChatMessageDto } from "@/lib/ai/types";

type Props = {
  message: AiChatMessageDto;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {isUser ? "You" : "Companion"}
      </p>
      <article
        aria-label={isUser ? "You said" : "BibleByte AI replied"}
        className={cn(
          "max-w-[95%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "border border-primary/20 bg-background/95 text-foreground"
            : "border border-border/80 bg-muted/50 text-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AssistantMessageMarkdown
            content={message.content}
            className="text-sm text-muted-foreground [&_p:first-child]:text-foreground [&_p:first-child]:font-medium"
          />
        )}
      </article>
    </div>
  );
}
