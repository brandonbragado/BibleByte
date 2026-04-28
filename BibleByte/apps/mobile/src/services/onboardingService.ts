import type { OnboardingPreference } from "@biblebites/contracts";
import { OnboardingPreferenceSchema } from "@biblebites/contracts";
import { supabase } from "./supabase/client";
import { requireAuthenticatedUser } from "./supabase/auth";
import { setCachedAnalyticsOptIn } from "./analyticsService";

export async function hasCompletedOnboarding(): Promise<boolean> {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    return false;
  }

  const { data, error: preferenceError } = await supabase.from("user_preferences").select("id").eq("user_id", user.id).maybeSingle();
  if (preferenceError) {
    throw preferenceError;
  }

  return Boolean(data?.id);
}

export async function saveOnboarding(payload: OnboardingPreference): Promise<void> {
  const parsed = OnboardingPreferenceSchema.parse(payload);
  const user = await requireAuthenticatedUser();

  const [{ error: profileError }, { error: preferenceError }, { error: scheduleError }] = await Promise.all([
    supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        display_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? null
      },
      { onConflict: "user_id" }
    ),
    supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        goal: parsed.goals[0],
        preferred_topics: parsed.topics,
        daily_reminder_time: parsed.reminderTime,
        analytics_opt_in: parsed.analyticsOptIn
      },
      { onConflict: "user_id" }
    ),
    supabase.from("notification_schedules").upsert(
      {
        user_id: user.id,
        reminder_time: parsed.reminderTime,
        timezone: parsed.timezone,
        enabled: parsed.skipReminderSetup !== true
      },
      { onConflict: "user_id" }
    )
  ]);

  if (profileError) {
    throw profileError;
  }
  if (preferenceError) {
    throw preferenceError;
  }
  if (scheduleError) {
    throw scheduleError;
  }

  setCachedAnalyticsOptIn(parsed.analyticsOptIn);
}
