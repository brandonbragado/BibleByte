import type { ScriptureProviderId } from "@/lib/scripture/types";
import { cn } from "@/lib/utils";

type Props = {
  translationLabel: string;
  detail: string;
  isPlaceholder?: boolean;
  providerId?: ScriptureProviderId;
  className?: string;
};

/** Visible attribution for any surface that shows scripture (required for trust + licensing). */
export function ScriptureAttribution({
  translationLabel,
  detail,
  isPlaceholder = true,
  providerId,
  className,
}: Props) {
  return (
    <footer
      className={cn(
        "mt-4 space-y-1 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground",
        className
      )}
    >
      <p className="font-medium text-muted-foreground/95">
        {translationLabel}
        {providerId ? (
          <span className="font-normal text-muted-foreground/80"> · {providerId}</span>
        ) : null}
      </p>
      <p>{detail}</p>
      {isPlaceholder ? (
        <p className="text-muted-foreground/85">TODO[NIV_LICENSE]: Placeholder or unlicensed mode — not for redistribution.</p>
      ) : providerId === "api_bible" ? (
        <p className="text-muted-foreground/85">
          Scripture text from API.Bible — follow their terms and your translation license (NIV only when
          NIV_SCRIPTURE_LICENSE_APPROVED is true).
        </p>
      ) : null}
    </footer>
  );
}
