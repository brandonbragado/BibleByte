import {
  SCRIPTURE_DEFAULT_ATTRIBUTION,
  SCRIPTURE_WIDGET_SAFE_BODY,
  allowsLicensedCopyrightOnSurface,
} from "@/config/scripture";

export type DailyVerseRow = {
  verse_date: string;
  reference: string;
  body_placeholder: string;
  attribution_note: string | null;
};

/**
 * Widget/snippet surfaces must not expose licensed NIV until explicit flags allow it.
 * TODO[NIV_LICENSE]: When rows can contain real NIV, branch on a future `content_tier` column (or set SCRIPTURE_WIDGET_STRICT_BODY=true).
 */
export function applyWidgetSnippetPolicy(row: DailyVerseRow): DailyVerseRow & {
  scripture_policy: { licensed_text: "allowed" | "withheld" };
} {
  if (!allowsLicensedCopyrightOnSurface("widget")) {
    const strict = process.env.SCRIPTURE_WIDGET_STRICT_BODY === "true";
    if (strict) {
      return {
        verse_date: row.verse_date,
        reference: row.reference,
        body_placeholder: SCRIPTURE_WIDGET_SAFE_BODY,
        attribution_note: row.attribution_note ?? SCRIPTURE_DEFAULT_ATTRIBUTION,
        scripture_policy: { licensed_text: "withheld" },
      };
    }
    return {
      ...row,
      scripture_policy: { licensed_text: "withheld" },
    };
  }

  return {
    ...row,
    scripture_policy: { licensed_text: "allowed" },
  };
}
