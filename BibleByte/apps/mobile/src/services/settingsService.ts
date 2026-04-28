import { supabase } from "./supabase/client";
import { getAuthenticatedUser, requireAuthenticatedUser } from "./supabase/auth";
import { setCachedAnalyticsOptIn } from "./analyticsService";

export type UserSettings = {
  displayName: string;
  email: string;
  goal: string;
  reminder: string;
  reminderEnabled: boolean;
  analyticsOptIn: boolean;
};

export async function fetchUserSettings(): Promise<UserSettings> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      displayName: "Guest",
      email: "Anonymous",
      goal: "Not set",
      reminder: "Not set",
      reminderEnabled: false,
      analyticsOptIn: false
    };
  }

  const [{ data: profile, error: profileError }, { data: preferences, error: prefError }, { data: schedule, error: scheduleError }] = await Promise.all([
    supabase.from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("goal, analytics_opt_in").eq("user_id", user.id).maybeSingle(),
    supabase.from("notification_schedules").select("reminder_time, enabled").eq("user_id", user.id).maybeSingle()
  ]);

  if (profileError) {
    throw profileError;
  }
  if (prefError) {
    throw prefError;
  }
  if (scheduleError) {
    throw scheduleError;
  }

  const optIn = preferences?.analytics_opt_in ?? false;
  setCachedAnalyticsOptIn(optIn);

  return {
    displayName: profile?.display_name ?? "BibleByte Member",
    email: user.email ?? "No email",
    goal: preferences?.goal ?? "Not set",
    reminder: schedule?.reminder_time ?? "Not set",
    reminderEnabled: Boolean(schedule?.enabled),
    analyticsOptIn: optIn
  };
}

export async function updateAnalyticsOptIn(value: boolean): Promise<void> {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("user_preferences")
    .update({ analytics_opt_in: value })
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
  setCachedAnalyticsOptIn(value);
}

/**
 * TODO[ACCOUNT_DELETE]: Wire to backend RPC `delete_account()` once it ships in
 * a follow-up migration. The RPC must cascade across user-scoped tables.
 */
export async function requestAccountDeletion(): Promise<void> {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("request_account_deletion", { p_user_id: user.id });
  if (error) {
    throw error;
  }
}
