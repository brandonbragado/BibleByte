import { headers } from "next/headers";

import {
  allowWithinWindow,
  resolveLimit,
  type RateLimitScope,
} from "@/lib/rate-limit/memory";

export async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

const WINDOW_MS = 60_000;

export async function enforceRateLimitServerAction(scope: RateLimitScope): Promise<void> {
  const ip = await getClientIpFromHeaders();
  const key = `${scope}:${ip}`;
  const max = resolveLimit(scope);
  if (!allowWithinWindow(key, WINDOW_MS, max)) {
    throw new Error("Too many attempts. Wait a minute and try again.");
  }
}
