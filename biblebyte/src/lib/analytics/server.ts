import { createClient } from "@/lib/supabase/server";

/** Inserts analytics_events only when user_profiles.analytics_opt_in is true. Best-effort (never throws). */
export async function instrumentAnalyticsEvent(
  name: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("analytics_opt_in")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.analytics_opt_in) return;

    const { error } = await supabase.from("analytics_events").insert({
      user_id: user.id,
      name,
      payload: payload ?? {},
    });

    if (error) {
      console.warn("analytics_events insert:", error.message);
    }
  } catch (e) {
    console.warn("instrumentAnalyticsEvent", e);
  }
}
