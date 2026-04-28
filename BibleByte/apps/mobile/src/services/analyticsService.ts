import type { z } from "zod";
import { AnalyticsEventSchema } from "@biblebites/contracts";
import { createKvStorage } from "./storage/kvStorage";
import { supabase } from "./supabase/client";
import { getAuthenticatedUser } from "./supabase/auth";
import type { Json } from "../types/supabase";

type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

/**
 * Analytics service.
 *
 * - Anonymous users: events are recorded with `user_id = null`. Allowed by the
 *   `analytics_events_insert_anon` RLS policy.
 * - Authenticated users: events only record when the user has opted in via
 *   `user_preferences.analytics_opt_in`. The opt-in flag is cached locally in
 *   MMKV to avoid an extra round-trip per event.
 */

const cache = createKvStorage("biblebyte.analytics");
const OPT_IN_KEY = "analytics_opt_in_v1";

export function setCachedAnalyticsOptIn(value: boolean): void {
  cache.set(OPT_IN_KEY, value ? "1" : "0");
}

function getCachedAnalyticsOptIn(): boolean | null {
  const raw = cache.getString(OPT_IN_KEY);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

async function isAnalyticsAllowed(userId: string | null): Promise<boolean> {
  if (!userId) {
    return true;
  }

  const cached = getCachedAnalyticsOptIn();
  if (cached !== null) {
    return cached;
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("analytics_opt_in")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return false;
  }

  const allowed = Boolean(data?.analytics_opt_in);
  setCachedAnalyticsOptIn(allowed);
  return allowed;
}

export async function trackEvent(
  eventName: AnalyticsEvent,
  metadata?: Record<string, string | number | boolean | null>
): Promise<void> {
  AnalyticsEventSchema.parse(eventName);

  const user = await getAuthenticatedUser().catch(() => null);
  const allowed = await isAnalyticsAllowed(user?.id ?? null);
  if (!allowed) {
    return;
  }

  const { error } = await supabase.from("analytics_events").insert({
    event_name: eventName,
    user_id: user?.id ?? null,
    metadata: (metadata ?? null) as Json | null
  });

  if (error) {
    console.warn("analytics_insert_failed", error.message);
  }
}
