import * as Notifications from "expo-notifications";
import { NotificationScheduleSchema } from "@biblebites/contracts";
import { supabase } from "./supabase/client";
import { getAuthenticatedUser } from "./supabase/auth";
import { trackEvent } from "./analyticsService";

export const TODAY_DEEP_LINK = "biblebyte://app/today";

type ScheduleInput = {
  hour: number;
  minute: number;
  /** Whether to also persist a Supabase notification_schedules row. Default true. */
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

/**
 * Schedule (or replace) the daily reminder notification.
 *
 * - Validates input via the shared `NotificationScheduleSchema` Zod contract.
 * - Cancels any prior local schedules to avoid duplicates.
 * - Persists a `notification_schedules` row so analytics and remote push
 *   (Phase 2) can be driven from a single source of truth.
 *
 * TODO[APNS_FCM_PHASE2]: Add remote push fallback via APNs/FCM driven by
 * `notification_schedules`. The local schedule remains as a redundancy.
 */
export async function scheduleDailyReminder({ hour, minute, persist = true }: ScheduleInput): Promise<void> {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error("Reminder hour must be between 0 and 23.");
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error("Reminder minute must be between 0 and 59.");
  }

  const payload = buildReminderPayload(hour, minute);

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      "Notification permission not granted. Enable notifications in system settings to receive your daily reminder."
    );
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "BibleByte",
      body: "Your verse for today is ready.",
      data: { deeplink: TODAY_DEEP_LINK }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute
    }
  });

  void trackEvent("reminder_scheduled", { reminderTime: payload.reminderTime });

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
  await Notifications.cancelAllScheduledNotificationsAsync();
  void trackEvent("reminder_disabled");

  const user = await getAuthenticatedUser();
  if (!user) {
    return;
  }
  const { error } = await supabase
    .from("notification_schedules")
    .update({ enabled: false })
    .eq("user_id", user.id);
  if (error) {
    throw error;
  }
}
