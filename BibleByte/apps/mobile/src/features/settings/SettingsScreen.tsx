import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { uiTheme } from "@biblebites/ui";
import { Button, Card, Screen } from "../../components/ui";
import { QueryStateBoundary } from "../../components/QueryStateBoundary";
import { disableDailyReminder, scheduleDailyReminder } from "../../services/notificationService";
import {
  fetchUserSettings,
  requestAccountDeletion,
  updateAnalyticsOptIn
} from "../../services/settingsService";
import { useAuthStore } from "../../stores/authStore";

const REMINDER_OPTIONS = [
  { label: "6:30 AM", hour: 6, minute: 30 },
  { label: "7:00 AM", hour: 7, minute: 0 },
  { label: "8:00 AM", hour: 8, minute: 0 },
  { label: "12:00 PM", hour: 12, minute: 0 },
  { label: "6:00 PM", hour: 18, minute: 0 },
  { label: "9:00 PM", hour: 21, minute: 0 }
] as const;

function reminderLabelFromTime(timeString: string | null | undefined): string {
  if (!timeString || timeString === "Not set") {
    return "Not set";
  }
  const [hourStr, minuteStr] = timeString.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return timeString;
  }
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const signOut = useAuthStore((state) => state.signOut);
  const profileQuery = useQuery({ queryKey: ["user-settings"], queryFn: fetchUserSettings });

  const [selectedLabel, setSelectedLabel] = useState<string>("8:00 AM");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profileQuery.data?.reminder && profileQuery.data.reminder !== "Not set") {
      const matched = REMINDER_OPTIONS.find((option) => {
        const formatted = `${String(option.hour).padStart(2, "0")}:${String(option.minute).padStart(2, "0")}:00`;
        return formatted === profileQuery.data?.reminder;
      });
      if (matched) {
        setSelectedLabel(matched.label);
      }
    }
  }, [profileQuery.data?.reminder]);

  const updateReminder = async (label: string) => {
    const option = REMINDER_OPTIONS.find((entry) => entry.label === label);
    if (!option) {
      return;
    }
    setSelectedLabel(label);
    setUpdating(true);
    try {
      await scheduleDailyReminder({ hour: option.hour, minute: option.minute });
      await queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    } catch (error) {
      Alert.alert("Reminder not updated", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const turnOffReminders = async () => {
    setUpdating(true);
    try {
      await disableDailyReminder();
      await queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      Alert.alert("Reminders off", "You can re-enable them anytime by picking a time above.");
    } catch (error) {
      Alert.alert("Could not disable reminders", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "You'll need your email and password to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut();
        }
      }
    ]);
  };

  const handleAnalyticsToggle = async (next: boolean) => {
    setUpdating(true);
    try {
      await updateAnalyticsOptIn(next);
      await queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    } catch (error) {
      Alert.alert("Could not update preference", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently remove your saved verses, progress, streak, and preferences. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await requestAccountDeletion();
              Alert.alert("Account deleted", "Your data has been removed. You'll be signed out now.");
              await signOut();
            } catch (error) {
              Alert.alert(
                "Could not delete account",
                error instanceof Error ? error.message : "Please try again later."
              );
            }
          }
        }
      ]
    );
  };

  return (
    <Screen title="Profile" subtitle="Calm, private, and in your control.">
      <QueryStateBoundary
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        loadingMessage="Loading your profile..."
        errorTitle="Unable to load profile"
        errorMessage="Please try again in a moment."
        onRetry={() => void profileQuery.refetch()}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card
            eyebrow="Account"
            title={profileQuery.data?.displayName ?? "BibleByte friend"}
            body={profileQuery.data?.email ?? "No email"}
          />

          <Card eyebrow="Goal" title={profileQuery.data?.goal ?? "Not set"} body="Set during onboarding. Personalizes your daily lesson topic." tone="soft" />

          <View style={styles.reminderBlock}>
            <Text style={styles.sectionEyebrow}>Daily reminder</Text>
            <Text style={styles.reminderCurrent}>
              Currently {reminderLabelFromTime(profileQuery.data?.reminder)}
            </Text>
            <View style={styles.grid}>
              {REMINDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => void updateReminder(option.label)}
                  disabled={updating}
                  style={[styles.timeOption, selectedLabel === option.label && styles.timeOptionActive]}
                >
                  <Text style={[styles.timeOptionText, selectedLabel === option.label && styles.timeOptionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              label="Turn off reminders"
              variant="ghost"
              size="sm"
              onPress={turnOffReminders}
              disabled={updating}
            />
          </View>

          <View style={styles.privacyBlock}>
            <Text style={styles.sectionEyebrow}>Privacy</Text>
            <View style={styles.privacyRow}>
              <View style={styles.privacyText}>
                <Text style={styles.privacyTitle}>
                  {profileQuery.data?.analyticsOptIn ? "Analytics is on" : "Analytics is off"}
                </Text>
                <Text style={styles.privacyBody}>
                  {profileQuery.data?.analyticsOptIn
                    ? "Anonymous usage helps us improve BibleByte. Toggle off anytime."
                    : "We won't record any product analytics until you opt in."}
                </Text>
              </View>
              <Switch
                value={Boolean(profileQuery.data?.analyticsOptIn)}
                onValueChange={(value) => void handleAnalyticsToggle(value)}
                disabled={updating}
                trackColor={{ true: uiTheme.colors.deepOlive, false: uiTheme.colors.border }}
                thumbColor={uiTheme.colors.parchment}
              />
            </View>
          </View>

          <Card
            eyebrow="Roadmap"
            title="Coming soon"
            body="Themes, font size, and an AI Bible study companion are planned for upcoming releases."
            tone="soft"
          />

          <View style={styles.dangerBlock}>
            <Button label="Sign out" variant="secondary" onPress={handleSignOut} fullWidth />
            <Button label="Delete account" variant="danger" onPress={handleDeleteAccount} fullWidth />
          </View>
        </ScrollView>
      </QueryStateBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.xxxl,
    gap: uiTheme.spacing.md
  },
  reminderBlock: {
    backgroundColor: uiTheme.colors.parchment,
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadows.card
  },
  sectionEyebrow: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    fontWeight: uiTheme.fontWeight.semibold,
    textTransform: "uppercase"
  },
  reminderCurrent: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs,
    marginTop: uiTheme.spacing.xs
  },
  timeOption: {
    width: "31%",
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.md,
    backgroundColor: uiTheme.colors.cream
  },
  timeOptionActive: {
    backgroundColor: uiTheme.colors.deepOlive,
    borderColor: uiTheme.colors.deepOlive
  },
  timeOptionText: {
    color: uiTheme.colors.deepOlive,
    fontWeight: uiTheme.fontWeight.semibold,
    fontSize: uiTheme.typography.bodySmall
  },
  timeOptionTextActive: {
    color: uiTheme.colors.parchment
  },
  privacyBlock: {
    backgroundColor: uiTheme.colors.parchment,
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadows.card
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.sm
  },
  privacyText: {
    flex: 1,
    gap: uiTheme.spacing.xxs
  },
  privacyTitle: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold
  },
  privacyBody: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: uiTheme.typography.lineHeight.normal
  },
  dangerBlock: {
    marginTop: uiTheme.spacing.md,
    gap: uiTheme.spacing.sm
  }
});
