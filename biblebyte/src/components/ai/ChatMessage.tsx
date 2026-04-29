import { cn } from "@/lib/utils";
import type { AiChatMessageDto } from "@/lib/ai/types";

type Props = {
  message: AiChatMessageDto;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <article
      aria-label={isUser ? "You said" : "BibleByte AI replied"}
      className={cn(
        "max-w-[95%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm",
        isUser
          ? "ml-auto border border-primary/20 bg-background/95 text-foreground"
          : "mr-auto border border-border/80 bg-muted/50 text-foreground"
      )}
    >
      {isUser ? (
        <p className="whitespace-pre-wrap">{message.content}</p>
      ) : (
        <div className="space-y-3 whitespace-pre-wrap text-muted-foreground">
          {message.content.split(/\n\n+/).map((para, i) => (
            <p key={i} className={i === 0 ? "font-medium text-foreground" : ""}>
              {para}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
