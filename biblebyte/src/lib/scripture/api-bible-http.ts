import { getApiBibleMaxRetries, getApiBibleFetchTimeoutMs } from "@/config/scripture";
import { ScriptureApiError } from "@/lib/scripture/types";

const API_BIBLE_BASE =
  process.env.API_BIBLE_BASE_URL?.replace(/\/$/, "") ?? "https://api.scripture.api.bible/v1";

export function getApiBibleBaseUrl(): string {
  return API_BIBLE_BASE;
}

export function requireApiBibleKey(): string {
  const key = process.env.API_BIBLE_KEY?.trim();
  if (!key) {
    throw new ScriptureApiError(
      "API.Bible is not configured (missing API_BIBLE_KEY).",
      "missing_api_key",
      503
    );
  }
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfterSeconds(res: Response): number | null {
  const ra = res.headers.get("retry-after");
  if (!ra) return null;
  const n = Number.parseInt(ra, 10);
  if (Number.isFinite(n) && n >= 0) return Math.min(n, 120);
  const when = Date.parse(ra);
  if (!Number.isNaN(when)) {
    const sec = Math.ceil((when - Date.now()) / 1000);
    return Math.min(Math.max(0, sec), 120);
  }
  return null;
}

export function isRetryableApiBibleStatus(status: number): boolean {
  return status === 408 || status === 502 || status === 503 || status === 504;
}

/**
 * Low-level JSON fetch to API.Bible: timeouts, limited retries, structured audit logs (no scripture body).
 */
export async function fetchApiBibleJson<T>(path: string, query?: Record<string, string>): Promise<T> {
  const key = requireApiBibleKey();
  const url = new URL(`${API_BIBLE_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const timeoutMs = getApiBibleFetchTimeoutMs();
  const maxAttempts = Math.max(1, getApiBibleMaxRetries() + 1);

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const t0 = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        headers: { "api-key": key },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        const retrySec = parseRetryAfterSeconds(res) ?? Math.min(2 ** attempt, 30);
        console.warn(
          JSON.stringify({
            event: "api_bible_rate_limited",
            path: url.pathname,
            attempt,
            retry_after_seconds: retrySec,
          })
        );
        if (attempt < maxAttempts) {
          await sleep(retrySec * 1000);
          continue;
        }
        throw new ScriptureApiError(
          "API.Bible rate limit exceeded — try again shortly.",
          "upstream_rate_limited",
          429
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const bodySnippet = body.slice(0, 120);
        console.error(
          JSON.stringify({
            event: "api_bible_http_error",
            path: url.pathname,
            status: res.status,
            attempt,
            duration_ms: Date.now() - t0,
            body_snippet: bodySnippet,
          })
        );

        if (isRetryableApiBibleStatus(res.status) && attempt < maxAttempts) {
          await sleep(Math.min(750 * attempt, 4000));
          continue;
        }

        let detail = `API.Bible request failed (${res.status}).`;
        if (res.status === 401) {
          try {
            const j = JSON.parse(body) as { message?: string };
            if (j?.message && typeof j.message === "string") {
              detail = `API.Bible: ${j.message}`;
            }
          } catch {
            /* ignore */
          }
        }

        const statusOut = res.status >= 500 ? 502 : res.status;
        throw new ScriptureApiError(detail, "upstream_error", statusOut === 401 ? 401 : statusOut);
      }

      console.info(
        JSON.stringify({
          event: "api_bible_request_ok",
          path: url.pathname,
          attempt,
          duration_ms: Date.now() - t0,
        })
      );

      return res.json() as Promise<T>;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (e instanceof ScriptureApiError) throw e;
      const aborted = e instanceof Error && e.name === "AbortError";
      console.error(
        JSON.stringify({
          event: aborted ? "api_bible_timeout" : "api_bible_network_error",
          path: url.pathname,
          attempt,
          message: e instanceof Error ? e.name : "unknown",
        })
      );
      if (aborted) {
        if (attempt < maxAttempts) {
          await sleep(400 * attempt);
          continue;
        }
        throw new ScriptureApiError(
          "API.Bible request timed out.",
          "upstream_timeout",
          504
        );
      }
      if (attempt < maxAttempts) {
        await sleep(400 * attempt);
        continue;
      }
      throw new ScriptureApiError("API.Bible network error.", "upstream_error", 502);
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new ScriptureApiError("API.Bible request failed.", "upstream_error", 502);
}
