import { NotificationScheduleSchema } from "@biblebites/contracts";
import { supabase } from "./supabase/client";
import { getAuthenticatedUser } from "./supabase/auth";
import { trackEvent } from "./analyticsService";

/**
 * Web shim for the notification service.
 *
 * `expo-notifications` only supports a small subset of features in browsers
 * (and requires a service worker for true background delivery), so the web
 * build SKIPS local scheduling but still:
 *   - validates input via the shared Zod schema,
 *   - persists `notification_schedules` rows so APNs/FCM (Phase 2) and
 *     account portability still work,
 *   - emits the same analytics events.
 *
 * TODO[WEB_NOTIFICATIONS_PHASE2]: implement service-worker-based Web Push
 * once the remote-push fallback (APNs/FCM) ships. For now the web preview
 * acknowledges the change and updates settings; no banner appears.
 */

export const TODAY_DEEP_LINK = "biblebyte://app/today";

type ScheduleInput = {
  hour: number;
  minute: number;
  persist?: boolean;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function buildReminderPayload(hour: number, minute: number) {
  const reminderTime = `${pad2(hour)}:${pad2(minute)}:00`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return NotificationScheduleSchema.parse({ reminderTime, timezone, enabled: true });
}

export async function scheduleDailyReminder({ hour, minute, persist = true }: ScheduleInput): Promise<void> {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error("Reminder hour must be between 0 and 23.");
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error("Reminder minute must be between 0 and 59.");
  }

  const payload = buildReminderPayload(hour, minute);

  void trackEvent("reminder_scheduled", { reminderTime: payload.reminderTime, platform: "web" });

  if (!persist) {
    return;
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return;
  }

  const { error } = await supabase.from("notification_schedules").upsert(
    {
      user_id: user.id,
      reminder_time: payload.reminderTime,
      timezone: payload.timezone,
      enabled: payload.enabled
    },
    { onConflict: "user_id" }
  );
  if (error) {
    throw error;
  }
}

export async function disableDailyReminder(): Promise<void> {
  void trackEvent("reminder_disabled", { platform: "web" });

  const user = await getAuthenticatedUser();
  if (!user) {
    return;
  }
  const { error } = await supabase.from("notification_schedules").update({ enabled: false }).eq("user_id", user.id);
  if (error) {
    throw error;
  }
}
