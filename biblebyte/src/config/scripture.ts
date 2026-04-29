/**
 * Scripture licensing, provider mode, and surface policy.
 *
 * TODO[NIV_LICENSE]: Legal sign-off before enabling licensed upstream or caching.
 * Product checklist: `docs/LICENSING_SCRIPTURE.md`.
 */

import type { ScriptureSurface } from "@/lib/scripture/types";

export const SCRIPTURE_TRANSLATION_CODE = "NIV" as const;

/** Shown in attribution footers — not a claim of licensed distribution. */
export const SCRIPTURE_TRANSLATION_LABEL = "NIV (planned)";

/** Product constraint: single translation in MVP — no switching UI until licensing allows. */
export const SCRIPTURE_TRANSLATION_POLICY =
  "NIV-only delivery once licensed — do not expose alternate translations without clearance.";

/** Shown when DB row has no attribution_note — keeps licensing reminder visible in-app. */
export const SCRIPTURE_DEFAULT_ATTRIBUTION =
  "Placeholder attribution — TODO[NIV_LICENSE]: publisher-approved wording.";

/** Safe copy for widget/snippet JSON when licensed text is withheld by policy. */
export const SCRIPTURE_WIDGET_SAFE_BODY =
  "Open BibleByte for today’s passage — licensed verse text is withheld on widget surfaces until policy flags enable it.";

/** Demo cap for mock/public-domain chapter verse rows (not canonical counts). */
export const SCRIPTURE_MOCK_VERSE_CAP = 18;

export type ScriptureProviderMode = "mock" | "public_domain" | "licensed_niv" | "api_bible";

export function getScriptureProviderMode(): ScriptureProviderMode {
  const raw = (process.env.SCRIPTURE_PROVIDER_MODE ?? "mock").trim().toLowerCase();
  if (
    raw === "public_domain" ||
    raw === "licensed_niv" ||
    raw === "mock" ||
    raw === "api_bible"
  ) {
    return raw;
  }
  return "mock";
}

/** API.Bible proxy routes (`/api/scripture/bibles`, `books`, `passages`, `search`) only run in this mode. */
export function isApiBibleScriptureMode(): boolean {
  return getScriptureProviderMode() === "api_bible";
}

/** Global gate: legal has approved serving NIV (or chosen licensor) from an upstream API. */
export function isNivScriptureLicenseApproved(): boolean {
  return process.env.NIV_SCRIPTURE_LICENSE_APPROVED === "true";
}

/** Allow caching full chapters (CDN/browser) — default off for NIV safety. */
export function allowFullChapterCache(): boolean {
  return process.env.SCRIPTURE_ALLOW_FULL_CHAPTER_CACHE === "true";
}

/** Allow packaging scripture as offline bundles — default off. */
export function allowOfflineBundles(): boolean {
  return process.env.SCRIPTURE_ALLOW_OFFLINE_BUNDLES === "true";
}

/**
 * Whether **copyrighted licensed text** may appear on a surface (not placeholders).
 * Placeholder/mock copy may still appear when this is false.
 */
export function allowsLicensedCopyrightOnSurface(surface: ScriptureSurface): boolean {
  if (!isNivScriptureLicenseApproved()) return false;
  if (surface === "widget") {
    return process.env.SCRIPTURE_ALLOW_LICENSED_TEXT_WIDGETS === "true";
  }
  if (surface === "push") {
    return process.env.SCRIPTURE_ALLOW_LICENSED_TEXT_PUSH === "true";
  }
  return true;
}

/** HTTP Cache-Control for chapter API responses (conservative defaults). */
export function cacheControlForChapterResponse(isPlaceholder: boolean): string {
  if (!allowFullChapterCache()) {
    return isPlaceholder ? "private, max-age=60" : "private, no-store";
  }
  return isPlaceholder ? "private, max-age=120" : "private, max-age=300";
}

/** Optional header telling clients offline bundling is forbidden unless env allows. */
export function offlineBundlePolicyHeader(): string {
  return allowOfflineBundles() ? "allowed" : "forbidden";
}

/**
 * When `SCRIPTURE_PROVIDER_MODE=api_bible`, serve mock placeholder chapter JSON if API.Bible
 * returns 401/403/5xx (so demos still work while keys are pending).
 */
export function apiBiblePlaceholderOnUpstreamError(): boolean {
  return process.env.API_BIBLE_PLACEHOLDER_ON_UPSTREAM_ERROR === "true";
}

/** Try API.Bible chapter for Home daily verse when mode is `api_bible`. On by default; set `HOME_DAILY_VERSE_USE_SCRIPTURE_API=false` to keep placeholder body only. */
export function homeDailyVerseUseScriptureApi(): boolean {
  if (!isApiBibleScriptureMode()) return false;
  const raw = process.env.HOME_DAILY_VERSE_USE_SCRIPTURE_API?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}

/** Per-request timeout for API.Bible `fetch` (ms). */
export function getApiBibleFetchTimeoutMs(): number {
  const raw = process.env.API_BIBLE_FETCH_TIMEOUT_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 15_000;
  if (!Number.isFinite(n)) return 15_000;
  return Math.min(60_000, Math.max(3_000, n));
}

/** Retries after transient failures (502/503/504/timeout429 backoff). Additional attempts beyond the first. */
export function getApiBibleMaxRetries(): number {
  const raw = process.env.API_BIBLE_MAX_RETRIES?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 2;
  if (!Number.isFinite(n)) return 2;
  return Math.min(5, Math.max(0, n));
}
