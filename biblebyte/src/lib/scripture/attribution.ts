import {
  isNivScriptureLicenseApproved,
  SCRIPTURE_DEFAULT_ATTRIBUTION,
  SCRIPTURE_TRANSLATION_LABEL,
} from "@/config/scripture";
import type { Bible, PassageAttribution } from "@/lib/scripture/types";

/**
 * Builds in-app attribution for API.Bible payloads. Safe to serialize to clients;
 * never embeds API keys or raw upstream errors.
 */
export function buildApiBibleAttribution(opts: {
  bibleMeta?: Bible | undefined;
  copyright?: string | null | undefined;
  activeBibleId: string;
}): PassageAttribution {
  const nivEnv = process.env.API_BIBLE_NIV_BIBLE_ID?.trim();
  const usingNiv = Boolean(
    isNivScriptureLicenseApproved() && nivEnv && nivEnv === opts.activeBibleId
  );

  const detailParts = [
    opts.bibleMeta?.name ?? "API.Bible",
    opts.copyright?.trim() || undefined,
    usingNiv
      ? "NIV enabled per license flags — honor API.Bible & publisher terms."
      : "Translation via API.Bible — not NIV unless NIV license + API_BIBLE_NIV_BIBLE_ID active.",
    SCRIPTURE_DEFAULT_ATTRIBUTION,
  ].filter(Boolean);

  return {
    translationLabel: opts.bibleMeta?.abbreviation ?? opts.bibleMeta?.name ?? SCRIPTURE_TRANSLATION_LABEL,
    detail: detailParts.join(" · "),
    requiresVisibleAttribution: true,
  };
}
