import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HighlightColor } from "@biblebites/contracts";
import { uiTheme } from "@biblebites/ui";
import { Screen } from "../../components/ui";
import { QueryStateBoundary } from "../../components/QueryStateBoundary";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  fetchHighlightsForChapter,
  fetchSavedVerseIds,
  fetchVersesByChapter,
  removeVerseHighlight,
  saveVerse,
  setVerseHighlight,
  unsaveVerse,
  upsertReadingPosition,
  type BibleVerse
} from "../../services/bibleReaderService";
import { shareVerse } from "../../services/shareService";
import { copyText } from "../../services/clipboardService";
import { trackEvent } from "../../services/analyticsService";
import { VerseActionSheet } from "./VerseActionSheet";
import { highlightTokenFor } from "./highlightTokens";

type Props = NativeStackScreenProps<RootStackParamList, "BibleVerses">;

type ActiveVerse = {
  id: string;
  reference: string;
  verseText: string;
};

export function VerseScreen({ route }: Props) {
  const { chapterId, chapterLabel, scrollToVerseId } = route.params;
  const queryClient = useQueryClient();

  const versesQuery = useQuery({
    queryKey: ["bible-verses", chapterId],
    queryFn: () => fetchVersesByChapter(chapterId)
  });
  const highlightsQuery = useQuery({
    queryKey: ["bible-highlights", chapterId],
    queryFn: () => fetchHighlightsForChapter(chapterId)
  });
  const savedQuery = useQuery({
    queryKey: ["bible-saved-verse-ids"],
    queryFn: fetchSavedVerseIds
  });

  const verses = versesQuery.data ?? [];
  const highlightMap = highlightsQuery.data ?? new Map<string, HighlightColor>();
  const savedSet = savedQuery.data ?? new Set<string>();

  const [active, setActive] = useState<ActiveVerse | null>(null);
  const closeSheet = () => setActive(null);

  // Track verse row layouts so we can scroll to a target verse on mount.
  const scrollRef = useRef<ScrollView>(null);
  const layoutsRef = useRef<Map<string, number>>(new Map());
  const handleVerseLayout = (verseId: string, event: LayoutChangeEvent) => {
    layoutsRef.current.set(verseId, event.nativeEvent.layout.y);
  };

  // Persist reading position when this chapter loads. We mark the user's
  // last position as the chapter's first verse_id (or, if jumped from a
  // reference, the targeted verse).
  useEffect(() => {
    if (!verses.length) {
      return;
    }
    const targetVerseId = scrollToVerseId ?? verses[0].id;
    void (async () => {
      try {
        // We need the chapter -> book mapping to upsert. Pull it from the
        // first verse via the chapter list cache, but simpler: query the
        // chapter row directly via Supabase, which we already do server-side
        // here.
        const { supabase } = await import("../../services/supabase/client");
        const { data: chapter } = await supabase
          .from("bible_chapters")
          .select("book_id")
          .eq("id", chapterId)
          .maybeSingle();
        if (chapter?.book_id) {
          await upsertReadingPosition({
            bookId: chapter.book_id,
            chapterId,
            verseId: targetVerseId
          });
        }
      } catch {
        // Best-effort. A failed reading-position upsert should never break the screen.
      }
    })();
  }, [chapterId, scrollToVerseId, verses]);

  // Scroll to target verse once it has been laid out.
  useEffect(() => {
    if (!scrollToVerseId || !verses.length) return;
    const tryScroll = (attempt: number) => {
      const y = layoutsRef.current.get(scrollToVerseId);
      if (y != null && scrollRef.current) {
        scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
        return;
      }
      if (attempt < 6) {
        setTimeout(() => tryScroll(attempt + 1), 80);
      }
    };
    tryScroll(0);
  }, [scrollToVerseId, verses]);

  const saveMutation = useMutation({
    mutationFn: async (input: { verseId: string; reference: string; isCurrentlySaved: boolean }) => {
      if (input.isCurrentlySaved) {
        await unsaveVerse(input.verseId);
      } else {
        await saveVerse(input.verseId);
      }
      return input;
    },
    onSuccess: (input) => {
      void queryClient.invalidateQueries({ queryKey: ["bible-saved-verse-ids"] });
      void queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      void trackEvent(input.isCurrentlySaved ? "verse_unsaved" : "verse_saved", {
        reference: input.reference,
        source: "bible_reader"
      });
    },
    onError: (error: unknown) => {
      Alert.alert("Unable to save", error instanceof Error ? error.message : "Please try again.");
    }
  });

  const highlightMutation = useMutation({
    mutationFn: async (input: { verseId: string; reference: string; nextColor: HighlightColor | null }) => {
      if (input.nextColor === null) {
        await removeVerseHighlight(input.verseId);
      } else {
        await setVerseHighlight(input.verseId, input.nextColor);
      }
      return input;
    },
    onMutate: async (input) => {
      // Optimistic local update so the row recolors instantly.
      await queryClient.cancelQueries({ queryKey: ["bible-highlights", chapterId] });
      const previous = queryClient.getQueryData<Map<string, HighlightColor>>([
        "bible-highlights",
        chapterId
      ]);
      const next = new Map(previous ?? []);
      if (input.nextColor === null) {
        next.delete(input.verseId);
      } else {
        next.set(input.verseId, input.nextColor);
      }
      queryClient.setQueryData(["bible-highlights", chapterId], next);
      return { previous };
    },
    onError: (error: unknown, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bible-highlights", chapterId], context.previous);
      }
      Alert.alert("Unable to highlight", error instanceof Error ? error.message : "Please try again.");
    },
    onSuccess: (input) => {
      void queryClient.invalidateQueries({ queryKey: ["bible-highlights", chapterId] });
      void queryClient.invalidateQueries({ queryKey: ["highlight-items"] });
      void trackEvent(input.nextColor ? "verse_highlighted" : "verse_unhighlighted", {
        reference: input.reference,
        color: input.nextColor
      });
    }
  });

  const handleShare = async () => {
    if (!active) return;
    try {
      await shareVerse({ reference: active.reference, text: active.verseText, source: "reader" });
      closeSheet();
    } catch (error) {
      Alert.alert("Unable to share", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleCopy = async () => {
    if (!active) return;
    const ok = await copyText(active.reference);
    if (ok) {
      Alert.alert("Copied", `${active.reference} copied to your clipboard.`);
    } else {
      Alert.alert("Copy not supported", "Use Share to copy this reference on this device.");
    }
    closeSheet();
  };

  const activeIsSaved = active ? savedSet.has(active.id) : false;
  const activeHighlight = active ? highlightMap.get(active.id) ?? null : null;

  const isPendingSaveForActive =
    !!active && saveMutation.isPending && saveMutation.variables?.verseId === active.id;

  const subtitleParts = useMemo(() => {
    const count = verses.length;
    if (count === 0) return "NIV placeholder content for MVP.";
    return `Tap any verse to save, highlight, share, or copy.`;
  }, [verses.length]);

  return (
    <Screen title={chapterLabel} subtitle={subtitleParts}>
      <QueryStateBoundary
        isLoading={versesQuery.isLoading}
        isError={versesQuery.isError}
        isEmpty={verses.length === 0}
        loadingMessage="Loading verses..."
        errorTitle="Unable to load verses"
        errorMessage="Please try again."
        emptyTitle="No verses found"
        emptyMessage="No placeholder verses were found for this chapter."
        onRetry={() => void versesQuery.refetch()}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {verses.map((verse) => {
            const reference = `${chapterLabel}:${verse.verseNumber}`;
            const highlight = highlightMap.get(verse.id) ?? null;
            const token = highlight ? highlightTokenFor(highlight) : null;
            return (
              <Pressable
                key={verse.id}
                accessibilityRole="button"
                accessibilityLabel={`${reference}. Tap for actions.`}
                onLayout={(event) => handleVerseLayout(verse.id, event)}
                onPress={() => setActive({ id: verse.id, reference, verseText: verse.verseText })}
                style={({ pressed }) => [
                  styles.row,
                  token ? { backgroundColor: token.tint, borderColor: token.bar } : null,
                  pressed ? styles.rowPressed : null
                ]}
              >
                {token ? <View style={[styles.tintBar, { backgroundColor: token.bar }]} /> : null}
                <Text style={styles.verseNumber}>{verse.verseNumber}</Text>
                <View style={styles.body}>
                  <Text style={styles.verseText}>{verse.verseText}</Text>
                  <View style={styles.metaRow}>
                    {savedSet.has(verse.id) ? <MetaPill label="Saved" /> : null}
                    {token ? <MetaPill label={token.label} accentColor={token.bar} /> : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </QueryStateBoundary>

      {active ? (
        <VerseActionSheet
          visible
          onClose={closeSheet}
          reference={active.reference}
          verseText={active.verseText}
          isSaved={activeIsSaved}
          currentHighlight={activeHighlight}
          onToggleSave={() =>
            saveMutation.mutate({
              verseId: active.id,
              reference: active.reference,
              isCurrentlySaved: activeIsSaved
            })
          }
          onSelectHighlight={(color) => {
            const nextColor = activeHighlight === color ? null : color;
            highlightMutation.mutate({
              verseId: active.id,
              reference: active.reference,
              nextColor
            });
          }}
          onClearHighlight={() => {
            if (!activeHighlight) return;
            highlightMutation.mutate({
              verseId: active.id,
              reference: active.reference,
              nextColor: null
            });
          }}
          onShare={() => void handleShare()}
          onCopy={() => void handleCopy()}
          isSavePending={isPendingSaveForActive}
        />
      ) : null}
    </Screen>
  );
}

function MetaPill({ label, accentColor }: { label: string; accentColor?: string }) {
  return (
    <View style={[styles.pill, accentColor ? { borderColor: accentColor } : null]}>
      <Text style={[styles.pillText, accentColor ? { color: accentColor } : null]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.xxxl,
    gap: uiTheme.spacing.sm
  },
  row: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
    backgroundColor: uiTheme.colors.parchment,
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.md,
    overflow: "hidden",
    ...uiTheme.shadows.card
  },
  rowPressed: {
    opacity: 0.85
  },
  tintBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4
  },
  verseNumber: {
    color: uiTheme.colors.gold,
    fontWeight: uiTheme.fontWeight.bold,
    fontSize: uiTheme.typography.body,
    minWidth: 24,
    textAlign: "right"
  },
  body: {
    flex: 1,
    gap: uiTheme.spacing.xs
  },
  verseText: {
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.body,
    lineHeight: uiTheme.typography.lineHeight.normal
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs,
    marginTop: 2
  },
  pill: {
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.pill,
    paddingHorizontal: uiTheme.spacing.xs,
    paddingVertical: 2
  },
  pillText: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.caption,
    fontWeight: uiTheme.fontWeight.semibold
  }
});
