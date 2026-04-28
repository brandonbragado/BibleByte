import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uiTheme } from "@biblebites/ui";
import { Button, Card, Screen, VerseCard } from "../../components/ui";
import { QueryStateBoundary } from "../../components/QueryStateBoundary";
import { fetchTodayLesson } from "../../services/apiClient";
import { markDailyByteComplete } from "../../services/progressService";
import { trackEvent } from "../../services/analyticsService";
import { shareVerse } from "../../services/shareService";
import {
  isDailySaved,
  saveDailyLocally,
  unsaveDailyLocally
} from "../../services/savedItemsService";
import { fetchScriptureOfTheDay } from "../../services/scriptureOfDayService";
import { useAppStore } from "../../state/appStore";
import { BibleChatPanel } from "./BibleChatPanel";
import { FloatingScriptureWidget } from "./FloatingScriptureWidget";

export function TodayScreen() {
  const queryClient = useQueryClient();
  const completeLesson = useAppStore((state) => state.completeLesson);
  const completedLessonIds = useAppStore((state) => state.completedLessonIds);

  const dateKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const spotlightQuery = useQuery({
    queryKey: ["scripture-spotlight", dateKey],
    queryFn: () => fetchScriptureOfTheDay(dateKey)
  });

  const lessonQuery = useQuery({
    queryKey: ["today-lesson"],
    queryFn: fetchTodayLesson
  });

  const lesson = lessonQuery.data;
  const segment = lesson?.segments[0];

  const [savedFlag, setSavedFlag] = useState<boolean>(false);

  const reference = segment?.verseReference ?? "";
  useEffect(() => {
    setSavedFlag(reference ? isDailySaved(reference) : false);
  }, [reference]);

  useEffect(() => {
    if (lesson) {
      void trackEvent("lesson_started");
    }
  }, [lesson]);

  const completeMutation = useMutation({
    mutationFn: (dailyByteId: string) => markDailyByteComplete(dailyByteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["progress-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const isCompletedLocally = useMemo(
    () => Boolean(lesson && completedLessonIds.includes(lesson.lessonId)),
    [completedLessonIds, lesson]
  );

  const onToggleSave = () => {
    if (!segment) {
      return;
    }
    if (savedFlag) {
      unsaveDailyLocally(segment.verseReference);
      setSavedFlag(false);
    } else {
      saveDailyLocally({
        reference: segment.verseReference,
        text: segment.scriptureTextPlaceholder,
        translation: "NIV"
      });
      setSavedFlag(true);
    }
    void queryClient.invalidateQueries({ queryKey: ["saved-items"] });
  };

  const onShare = async () => {
    if (!segment) {
      return;
    }
    try {
      await shareVerse({
        reference: segment.verseReference,
        text: segment.scriptureTextPlaceholder,
        translation: "NIV",
        source: "today"
      });
    } catch (error) {
      Alert.alert("Unable to share", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const onComplete = async () => {
    if (!lesson) {
      return;
    }
    try {
      await completeMutation.mutateAsync(lesson.lessonId);
      completeLesson(lesson.lessonId);
      await trackEvent("lesson_completed");
      await trackEvent("streak_updated");
    } catch (error) {
      Alert.alert("Unable to complete", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <Screen title="Today" subtitle="A small scripture, gently delivered.">
      <ScrollView contentContainerStyle={styles.scrollOuter} showsVerticalScrollIndicator={false}>
        {spotlightQuery.isLoading ? (
          <View style={styles.spotlightLoading}>
            <ActivityIndicator color={uiTheme.colors.deepOlive} />
            <Text style={styles.spotlightLoadingText}>Choosing today&apos;s spotlight verse…</Text>
          </View>
        ) : null}
        {spotlightQuery.isError ? (
          <Text style={styles.spotlightError}>Unable to load spotlight verse right now.</Text>
        ) : null}
        {spotlightQuery.data ? <FloatingScriptureWidget spotlight={spotlightQuery.data} /> : null}

        <QueryStateBoundary
          isLoading={lessonQuery.isLoading}
          isError={lessonQuery.isError}
          isEmpty={!lesson || !segment}
          loadingMessage="Preparing today's verse..."
          errorTitle="Unable to load today"
          errorMessage="Pull to refresh or try again in a moment."
          emptyTitle="Today is being prepared"
          emptyMessage="A new BibleByte will appear here soon."
          onRetry={() => void lessonQuery.refetch()}
        >
          <Text style={styles.dateLabel}>{formatToday()}</Text>
          {segment ? (
            <VerseCard
              eyebrow="Daily BibleByte"
              reference={segment.verseReference}
              text={segment.scriptureTextPlaceholder}
              translation="NIV"
              isSaved={savedFlag}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ) : null}

          {segment ? (
            <Card eyebrow="Reflection" title="A short context" body={segment.contextExplanation} />
          ) : null}

          {segment ? (
            <Card
              eyebrow="Reflect"
              title={segment.reflectionQuestion}
              body="Pause for a breath. Notice what surfaces."
              tone="soft"
            />
          ) : null}

          {segment ? (
            <Card eyebrow="Prayer" title="A prayer prompt" body={segment.actionPrompt} />
          ) : null}

          <View style={styles.completeBlock}>
            <Button
              label={
                isCompletedLocally
                  ? "Marked complete"
                  : completeMutation.isPending
                    ? "Saving..."
                    : "Mark complete"
              }
              onPress={onComplete}
              variant={isCompletedLocally ? "secondary" : "primary"}
              size="lg"
              loading={completeMutation.isPending}
              fullWidth
              disabled={isCompletedLocally || !lesson}
            />
            <Text style={styles.estimateText}>
              Estimated reading time: {lesson?.estimatedMinutes ?? 5} minutes
            </Text>
          </View>
        </QueryStateBoundary>

        <View style={styles.chatSection}>
          <BibleChatPanel />
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatToday() {
  const now = new Date();
  return now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

const styles = StyleSheet.create({
  scrollOuter: {
    paddingBottom: uiTheme.spacing.xxxl,
    gap: uiTheme.spacing.md
  },
  spotlightLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    marginBottom: uiTheme.spacing.sm
  },
  spotlightLoadingText: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.bodySmall
  },
  spotlightError: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption,
    marginBottom: uiTheme.spacing.sm
  },
  dateLabel: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    fontWeight: uiTheme.fontWeight.semibold,
    textTransform: "uppercase"
  },
  completeBlock: {
    marginTop: uiTheme.spacing.md,
    gap: uiTheme.spacing.xs,
    alignItems: "center"
  },
  estimateText: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption,
    fontWeight: uiTheme.fontWeight.medium
  },
  chatSection: {
    marginTop: uiTheme.spacing.lg
  }
});
