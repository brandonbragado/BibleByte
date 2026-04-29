/** API.Bible ids are typically hex + hyphen; keep permissive but bounded. */
const BIBLE_ID_RE = /^[a-zA-Z0-9._-]{1,64}$/;
const PASSAGE_ID_RE = /^[a-zA-Z0-9._~%:\-]{1,128}$/;

export const SEARCH_QUERY_MAX_LENGTH = 200;

export function sanitizeBibleId(raw: string | null | undefined): string | null {
  const s = raw?.trim() ?? "";
  if (!s || !BIBLE_ID_RE.test(s)) return null;
  return s;
}

export function sanitizePassageId(raw: string | null | undefined): string | null {
  const s = raw?.trim() ?? "";
  if (!s || !PASSAGE_ID_RE.test(s)) return null;
  return s;
}

/** Returns trimmed query or null if too short / too long / unsafe. */
export function sanitizeSearchQuery(raw: string | null | undefined): string | null {
  const s = raw?.trim() ?? "";
  if (s.length < 2) return null;
  if (s.length > SEARCH_QUERY_MAX_LENGTH) return null;
  // Strip control characters
  const cleaned = s.replace(/[\u0000-\u001F\u007F]/g, "");
  if (cleaned.length < 2) return null;
  return cleaned;
}

export function clampSearchLimit(raw: string | null | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 20;
  if (!Number.isFinite(n)) return 20;
  return Math.min(50, Math.max(1, n));
}
