import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { uiTheme } from "@biblebites/ui";
import { Card, Screen } from "../../components/ui";
import { QueryStateBoundary } from "../../components/QueryStateBoundary";
import { fetchProgressSummary } from "../../services/progressService";
import { fetchUserSettings } from "../../services/settingsService";

export function ProgressScreen() {
  const progressQuery = useQuery({
    queryKey: ["progress-summary"],
    queryFn: fetchProgressSummary
  });
  const settingsQuery = useQuery({
    queryKey: ["user-settings"],
    queryFn: fetchUserSettings
  });

  const streak = progressQuery.data?.streak ?? 0;
  const completed = progressQuery.data?.completedLessons ?? 0;
  const reminder = settingsQuery.data?.reminder ?? "Not set";
  const reminderEnabled = settingsQuery.data?.reminderEnabled ?? false;
  const goal = settingsQuery.data?.goal ?? "Not set";

  return (
    <Screen title="Growth" subtitle="Consistency over intensity.">
      <QueryStateBoundary
        isLoading={progressQuery.isLoading}
        isError={progressQuery.isError}
        loadingMessage="Loading your growth..."
        errorTitle="Unable to load growth"
        errorMessage="Please try again in a moment."
        onRetry={() => void progressQuery.refetch()}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statUnit}>day{streak === 1 ? "" : "s"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{completed}</Text>
              <Text style={styles.statUnit}>lesson{completed === 1 ? "" : "s"}</Text>
            </View>
          </View>

          <Card
            eyebrow="This week"
            title={completed > 0 ? "You're showing up" : "Begin a gentle rhythm"}
            body={
              completed > 0
                ? "Consistency builds quietly. Keep showing up - even three minutes counts."
                : "Complete today's BibleByte to begin your streak. Small steps, every day."
            }
            tone="soft"
          />

          <Card
            eyebrow="Focus"
            title={goal}
            body={
              reminderEnabled
                ? `Reminder set for ${reminder}.`
                : "No daily reminder yet — turn one on in Profile → Settings whenever you're ready."
            }
          />

          <Card
            eyebrow="Roadmap"
            title="Coming soon"
            body="Visual streak calendar, weekly summaries, and reading plans - all NIV-only and licensing-aware."
          />
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
  statsRow: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.parchment,
    borderRadius: uiTheme.radius.lg,
    padding: uiTheme.spacing.lg,
    gap: 2,
    ...uiTheme.shadows.card
  },
  statLabel: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    fontWeight: uiTheme.fontWeight.semibold,
    textTransform: "uppercase"
  },
  statValue: {
    color: uiTheme.colors.deepOlive,
    fontSize: 44,
    fontWeight: uiTheme.fontWeight.heavy,
    letterSpacing: -1
  },
  statUnit: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.caption
  }
});
