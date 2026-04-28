import { NextResponse } from "next/server";

/** Simple per-process token bucket — adequate for single-instance preview; use Redis/Upstash at scale (critical action item #5). */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function allowWithinWindow(key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

const WINDOW_MS = 60_000;

export type RateLimitScope =
  | "chat"
  | "analytics"
  | "snippet"
  | "scripture"
  | "push_register"
  | "delete_account";

export function resolveLimit(scope: RateLimitScope): number {
  const envMap: Record<RateLimitScope, string | undefined> = {
    chat: process.env.RATE_LIMIT_CHAT_PER_MINUTE,
    analytics: process.env.RATE_LIMIT_ANALYTICS_PER_MINUTE,
    snippet: process.env.RATE_LIMIT_SNIPPET_PER_MINUTE,
    scripture: process.env.RATE_LIMIT_SCRIPTURE_PER_MINUTE,
    push_register: process.env.RATE_LIMIT_PUSH_REGISTER_PER_MINUTE,
    delete_account: process.env.RATE_LIMIT_ACCOUNT_DELETE_PER_MINUTE,
  };
  const defaults: Record<RateLimitScope, number> = {
    chat: 30,
    analytics: 120,
    snippet: 180,
    scripture: 90,
    push_register: 10,
    delete_account: 3,
  };
  const raw = envMap[scope];
  const n = raw ? Number.parseInt(raw, 10) : defaults[scope];
  return Number.isFinite(n) && n > 0 ? n : defaults[scope];
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Returns a 429 response when limited; otherwise null. */
export function rateLimitResponse(req: Request, scope: RateLimitScope): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${scope}:${ip}`;
  const max = resolveLimit(scope);
  if (!allowWithinWindow(key, WINDOW_MS, max)) {
    return NextResponse.json(
      { error: "rate_limited", retry_after_seconds: Math.ceil(WINDOW_MS / 1000) },
      { status: 429 }
    );
  }
  return null;
}
