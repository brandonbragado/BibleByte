import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { uiTheme } from "@biblebites/ui";
import { Button, Screen, VerseCard } from "../../components/ui";
import { QueryStateBoundary } from "../../components/QueryStateBoundary";
import { fetchAllSavedItems, unsaveDailyLocally, type SavedItem } from "../../services/savedItemsService";
import { shareVerse } from "../../services/shareService";
import {
  fetchAllHighlights,
  removeVerseHighlight,
  unsaveVerse,
  type VerseHighlightDetail
} from "../../services/bibleReaderService";
import { trackEvent } from "../../services/analyticsService";
import { highlightTokenFor } from "../bible-reader/highlightTokens";

export function BookmarksScreen() {
  const queryClient = useQueryClient();
  const savedQuery = useQuery({
    queryKey: ["saved-items"],
    queryFn: fetchAllSavedItems
  });
  const highlightsQuery = useQuery({
    queryKey: ["highlight-items"],
    queryFn: fetchAllHighlights
  });

  const items = savedQuery.data ?? [];
  const highlights = highlightsQuery.data ?? [];
  const isEmpty = items.length === 0 && highlights.length === 0;

  const handleShare = async (item: SavedItem) => {
    try {
      await shareVerse({
        reference: item.reference,
        text: item.text,
        translation: item.translation,
        source: "saved"
      });
    } catch (error) {
      Alert.alert("Unable to share", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleRemove = async (item: SavedItem) => {
    try {
      if (item.source === "local") {
        unsaveDailyLocally(item.reference);
      } else if (item.verseId) {
        await unsaveVerse(item.verseId);
        void trackEvent("verse_unsaved", { reference: item.reference, source: "bible_reader" });
      } else {
        Alert.alert("Unable to remove", "Saved verse is missing a verse reference.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["saved-items"] });
    } catch (error) {
      Alert.alert("Unable to remove", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleRemoveHighlight = async (highlight: VerseHighlightDetail) => {
    try {
      await removeVerseHighlight(highlight.verseId);
      void trackEvent("verse_unhighlighted", {
        reference: highlight.reference,
        color: highlight.color
      });
      void queryClient.invalidateQueries({ queryKey: ["highlight-items"] });
      void queryClient.invalidateQueries({ queryKey: ["bible-highlights"] });
    } catch (error) {
      Alert.alert("Unable to remove", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <Screen title="Saved" subtitle="A quiet collection of verses you want to keep close.">
      <QueryStateBoundary
        isLoading={savedQuery.isLoading || highlightsQuery.isLoading}
        isError={savedQuery.isError || highlightsQuery.isError}
        isEmpty={isEmpty}
        loadingMessage="Loading your saved verses..."
        errorTitle="Unable to load saved verses"
        errorMessage="Please try again shortly."
        emptyTitle="Nothing saved yet"
        emptyMessage="Tap a verse in the Bible tab to save, highlight, or share it."
        onRetry={() => {
          void savedQuery.refetch();
          void highlightsQuery.refetch();
        }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {highlights.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              {highlights.map((highlight) => {
                const token = highlightTokenFor(highlight.color);
                return (
                  <View
                    key={highlight.verseId}
                    style={[
                      styles.highlightCard,
                      { backgroundColor: token.tint, borderColor: token.bar }
                    ]}
                  >
                    <View style={[styles.highlightBar, { backgroundColor: token.bar }]} />
                    <View style={styles.highlightBody}>
                      <Text style={styles.highlightReference}>{highlight.reference}</Text>
                      <Text style={styles.highlightText}>{highlight.verseText}</Text>
                      <View style={styles.highlightActions}>
                        <Button
                          label="Remove highlight"
                          variant="ghost"
                          size="sm"
                          onPress={() => void handleRemoveHighlight(highlight)}
                        />
                        <Button
                          label="Share"
                          variant="ghost"
                          size="sm"
                          onPress={() =>
                            void shareVerse({
                              reference: highlight.reference,
                              text: highlight.verseText,
                              source: "saved"
                            }).catch((error: unknown) =>
                              Alert.alert(
                                "Unable to share",
                                error instanceof Error ? error.message : "Please try again."
                              )
                            )
                          }
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {items.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved verses</Text>
              {items.map((item) => (
                <View key={`${item.source}-${item.id}`}>
                  <VerseCard
                    reference={item.reference}
                    text={item.text}
                    translation={item.translation}
                    isSaved
                    onShare={() => handleShare(item)}
                    onToggleSave={() => void handleRemove(item)}
                  />
                  {item.source === "local" ? (
                    <Text style={styles.sourceLabel}>Saved on this device</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.footer}>
            <Button
              label="Refresh"
              variant="ghost"
              size="sm"
              onPress={() => {
                void savedQuery.refetch();
                void highlightsQuery.refetch();
              }}
            />
          </View>
        </ScrollView>
      </QueryStateBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.xxxl,
    gap: uiTheme.spacing.lg
  },
  section: {
    gap: uiTheme.spacing.sm
  },
  sectionTitle: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold,
    marginBottom: uiTheme.spacing.xxs
  },
  highlightCard: {
    flexDirection: "row",
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
    ...uiTheme.shadows.card
  },
  highlightBar: {
    width: 4
  },
  highlightBody: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    gap: uiTheme.spacing.xs
  },
  highlightReference: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: uiTheme.fontWeight.semibold
  },
  highlightText: {
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.body,
    lineHeight: uiTheme.typography.lineHeight.normal
  },
  highlightActions: {
    flexDirection: "row",
    gap: uiTheme.spacing.xs,
    marginTop: 2
  },
  sourceLabel: {
    marginTop: uiTheme.spacing.xxs,
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption
  },
  footer: {
    alignItems: "center",
    marginTop: uiTheme.spacing.md
  }
});
