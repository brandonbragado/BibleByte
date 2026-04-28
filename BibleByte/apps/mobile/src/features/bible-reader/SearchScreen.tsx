import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import { Button, Input, Screen } from "../../components/ui";
import { EmptyState, ErrorState, LoadingState } from "../../components/states";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  fetchBibleBooks,
  parseReference,
  resolveReferenceJump,
  saveVerse,
  searchVerses,
  type BibleBook,
  type BibleVerse,
  type ReferenceJumpResolution
} from "../../services/bibleReaderService";
import { shareVerse } from "../../services/shareService";
import { trackEvent } from "../../services/analyticsService";

type Props = NativeStackScreenProps<RootStackParamList, "BibleSearch">;

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [keywordResults, setKeywordResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [referenceMatch, setReferenceMatch] = useState<ReferenceJumpResolution | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const booksQuery = useQuery({ queryKey: ["bible-books"], queryFn: fetchBibleBooks });
  const books: BibleBook[] = booksQuery.data ?? [];

  // Parse the query as a reference whenever the user types or the book list arrives.
  const parsedReference = useMemo(() => {
    if (!query.trim() || books.length === 0) return null;
    return parseReference(query, books);
  }, [query, books]);

  // Resolve the parsed reference to a real chapter/verse on each change.
  useEffect(() => {
    let cancelled = false;
    setReferenceError(null);
    if (!parsedReference) {
      setReferenceMatch(null);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const resolution = await resolveReferenceJump(parsedReference);
        if (cancelled) return;
        if (!resolution) {
          setReferenceMatch(null);
          setReferenceError(
            `${parsedReference.bookName} ${parsedReference.chapterNumber}${
              parsedReference.verseNumber ? `:${parsedReference.verseNumber}` : ""
            } isn't seeded yet — try a different chapter.`
          );
          return;
        }
        setReferenceMatch(resolution);
      } catch (error) {
        if (cancelled) return;
        setReferenceError(error instanceof Error ? error.message : "Could not resolve reference.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parsedReference]);

  const saveMutation = useMutation({
    mutationFn: async (input: { verseId: string; reference: string }) => {
      await saveVerse(input.verseId);
      return input;
    },
    onSuccess: ({ reference }) => {
      void queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      void trackEvent("verse_saved", { reference, source: "search" });
    },
    onError: (error: unknown) => {
      Alert.alert("Unable to save", error instanceof Error ? error.message : "Please try again.");
    }
  });

  const runKeywordSearch = async () => {
    if (!query.trim()) {
      setKeywordResults([]);
      return;
    }
    setIsSearching(true);
    setErrorText(null);
    try {
      const data = await searchVerses(query);
      setKeywordResults(data);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleJump = (resolution: ReferenceJumpResolution) => {
    void trackEvent("reference_jumped", {
      reference: `${resolution.bookName} ${resolution.chapterNumber}${
        resolution.verseNumber ? `:${resolution.verseNumber}` : ""
      }`,
      source: "search"
    });
    navigation.navigate("BibleVerses", {
      chapterId: resolution.chapterId,
      chapterLabel: `${resolution.bookName} ${resolution.chapterNumber}`,
      scrollToVerseId: resolution.verseId ?? undefined
    });
  };

  const showEmptyHint =
    !isSearching && !errorText && !referenceMatch && !referenceError && keywordResults.length === 0;

  return (
    <Screen
      title="Search"
      subtitle="Type a reference like John 3:16, or a keyword like trust."
    >
      <View style={styles.searchBlock}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="John 3:16  ·  trust  ·  peace"
          autoCapitalize="none"
          onSubmitEditing={runKeywordSearch}
          returnKeyType="search"
        />
        <Button
          label={isSearching ? "Searching..." : "Search"}
          onPress={runKeywordSearch}
          loading={isSearching}
          fullWidth
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {referenceMatch ? (
          <Pressable accessibilityRole="button" onPress={() => handleJump(referenceMatch)} style={styles.jumpCard}>
            <Text style={styles.jumpEyebrow}>Reference match</Text>
            <Text style={styles.jumpReference}>
              {referenceMatch.bookName} {referenceMatch.chapterNumber}
              {referenceMatch.verseNumber ? `:${referenceMatch.verseNumber}` : ""}
            </Text>
            <Text style={styles.jumpHint}>
              {referenceMatch.verseId
                ? "Open chapter and scroll to this verse"
                : referenceMatch.parsed.verseNumber
                  ? "Verse not seeded yet. Open the chapter."
                  : "Open this chapter"}
            </Text>
          </Pressable>
        ) : null}

        {referenceError && !referenceMatch ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{referenceError}</Text>
          </View>
        ) : null}

        {isSearching ? <LoadingState message="Searching verses..." /> : null}
        {errorText ? (
          <ErrorState
            title="Search unavailable"
            message={errorText}
            actionLabel="Retry"
            onActionPress={() => void runKeywordSearch()}
          />
        ) : null}
        {showEmptyHint ? (
          <EmptyState
            title="Try a reference or keyword"
            message="Examples: John 3:16, Ps 23, trust, peace, hope."
          />
        ) : null}

        {keywordResults.length > 0 ? <Text style={styles.sectionLabel}>Keyword matches</Text> : null}
        {keywordResults.map((verse) => (
          <View key={verse.id} style={styles.row}>
            <Text style={styles.text}>
              <Text style={styles.number}>{verse.verseNumber}. </Text>
              {verse.verseText}
            </Text>
            <View style={styles.actions}>
              <Button
                label="Save"
                variant="ghost"
                size="sm"
                onPress={() =>
                  saveMutation.mutate({
                    verseId: verse.id,
                    reference: `Verse ${verse.verseNumber}`
                  })
                }
                disabled={saveMutation.isPending}
              />
              <Button
                label="Share"
                variant="ghost"
                size="sm"
                onPress={async () => {
                  try {
                    await shareVerse({
                      reference: `Verse ${verse.verseNumber}`,
                      text: verse.verseText,
                      source: "search"
                    });
                  } catch (error) {
                    Alert.alert(
                      "Unable to share",
                      error instanceof Error ? error.message : "Please try again."
                    );
                  }
                }}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBlock: {
    gap: uiTheme.spacing.sm,
    marginBottom: uiTheme.spacing.sm
  },
  scroll: {
    paddingBottom: uiTheme.spacing.xxxl,
    gap: uiTheme.spacing.sm
  },
  jumpCard: {
    backgroundColor: uiTheme.colors.deepOlive,
    borderRadius: uiTheme.radius.lg,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.md,
    gap: 4,
    ...uiTheme.shadows.raised
  },
  jumpEyebrow: {
    color: uiTheme.colors.sand,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    textTransform: "uppercase",
    fontWeight: uiTheme.fontWeight.semibold
  },
  jumpReference: {
    color: uiTheme.colors.parchment,
    fontSize: uiTheme.typography.h2,
    fontWeight: uiTheme.fontWeight.bold
  },
  jumpHint: {
    color: uiTheme.colors.sand,
    fontSize: uiTheme.typography.bodySmall
  },
  notice: {
    backgroundColor: uiTheme.colors.cream,
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm
  },
  noticeText: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.bodySmall
  },
  sectionLabel: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    textTransform: "uppercase",
    fontWeight: uiTheme.fontWeight.semibold,
    marginTop: uiTheme.spacing.sm
  },
  row: {
    backgroundColor: uiTheme.colors.parchment,
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.md,
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadows.card
  },
  text: {
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.body,
    lineHeight: uiTheme.typography.lineHeight.normal
  },
  number: {
    color: uiTheme.colors.gold,
    fontWeight: uiTheme.fontWeight.bold
  },
  actions: {
    flexDirection: "row",
    gap: uiTheme.spacing.xs
  }
});
