import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingPreferenceSchema } from "@biblebites/contracts";
import { uiTheme } from "@biblebites/ui";
import { Button, Screen } from "../../components/ui";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { disableDailyReminder, scheduleDailyReminder } from "../../services/notificationService";
import { saveOnboarding } from "../../services/onboardingService";
import { trackEvent } from "../../services/analyticsService";
import { defaultDailyAmount, useAppStore } from "../../state/appStore";

type Props = NativeStackScreenProps<RootStackParamList, "Reminder">;

const TIMES = [
  { label: "6:30 AM", hour: 6, minute: 30 },
  { label: "7:00 AM", hour: 7, minute: 0 },
  { label: "8:00 AM", hour: 8, minute: 0 },
  { label: "12:00 PM", hour: 12, minute: 0 },
  { label: "6:00 PM", hour: 18, minute: 0 },
  { label: "9:00 PM", hour: 21, minute: 0 }
] as const;

export function ReminderScreen({ navigation }: Props) {
  const onboardingDraft = useAppStore((state) => state.onboardingDraft);
  const setOnboarding = useAppStore((state) => state.setOnboarding);
  const [selectedLabel, setSelectedLabel] = useState<string>("8:00 AM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const selectedTime = useMemo(
    () => TIMES.find((item) => item.label === selectedLabel) ?? TIMES[2],
    [selectedLabel]
  );

  const goHomeToday = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs", params: { screen: "Today" } }]
    });
  };

  const finishOnboarding = async (skipReminder: boolean) => {
    if (!onboardingDraft) {
      navigation.replace("Goal");
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);
    try {
      const combinedTopics = Array.from(new Set([...onboardingDraft.topics, ...onboardingDraft.faithAnswers]));
      const fallbackTime = `${String(TIMES[2].hour).padStart(2, "0")}:${String(TIMES[2].minute).padStart(2, "0")}:00`;
      const reminderTime = skipReminder
        ? fallbackTime
        : `${String(selectedTime.hour).padStart(2, "0")}:${String(selectedTime.minute).padStart(2, "0")}:00`;

      const payload = OnboardingPreferenceSchema.parse({
        goals: [onboardingDraft.goal],
        topics: combinedTopics,
        reminderTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        dailyAmountType: defaultDailyAmount,
        analyticsOptIn: true,
        skipReminderSetup: skipReminder ? true : undefined
      });

      // Skip: go straight to Today (homepage), then persist so the UI never waits on network.
      if (skipReminder) {
        goHomeToday();
      }

      await saveOnboarding(payload);
      setOnboarding(payload);

      if (!skipReminder) {
        try {
          await scheduleDailyReminder({ hour: selectedTime.hour, minute: selectedTime.minute });
        } catch (notifError) {
          console.warn("scheduleDailyReminder_failed", notifError);
        }
      } else {
        try {
          await disableDailyReminder();
        } catch (notifError) {
          console.warn("disableDailyReminder_failed", notifError);
        }
      }

      await trackEvent("onboarding_completed");

      if (!skipReminder) {
        goHomeToday();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete onboarding.";
      if (skipReminder) {
        Alert.alert("Couldn't save your preferences", `${message}\n\nYou can update Profile → Settings anytime.`);
      } else {
        setErrorText(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      title="Choose a reminder"
      subtitle="A gentle daily nudge to spend a few minutes in scripture."
      footer={
        <View style={styles.footerActions}>
          <Button
            label={isSubmitting ? "Saving..." : "Start my BibleByte"}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={() => void finishOnboarding(false)}
          />
          <Button
            label="Skip for now"
            variant="ghost"
            size="md"
            fullWidth
            disabled={isSubmitting}
            onPress={() => void finishOnboarding(true)}
          />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {TIMES.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => setSelectedLabel(item.label)}
              style={[styles.option, selectedLabel === item.label && styles.optionActive]}
            >
              <Text style={[styles.optionText, selectedLabel === item.label && styles.optionTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        <Text style={styles.helper}>
          Skip if you&apos;d rather choose later — you can turn reminders on anytime in Profile {"\u203A"} Settings.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm
  },
  option: {
    width: "48%",
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.md,
    backgroundColor: uiTheme.colors.parchment
  },
  optionActive: {
    backgroundColor: uiTheme.colors.deepOlive,
    borderColor: uiTheme.colors.deepOlive
  },
  optionText: {
    color: uiTheme.colors.deepOlive,
    fontWeight: uiTheme.fontWeight.semibold,
    fontSize: uiTheme.typography.body
  },
  optionTextActive: {
    color: uiTheme.colors.parchment
  },
  helper: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption,
    textAlign: "center"
  },
  error: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption,
    textAlign: "center"
  },
  footerActions: {
    gap: uiTheme.spacing.sm,
    width: "100%"
  }
});
