import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { uiTheme } from "@biblebites/ui";
import { ListRow, Screen } from "../../components/ui";
import { QueryStateBoundary } from "../../components/QueryStateBoundary";
import {
  fetchBibleBooksGrouped,
  fetchLastReadingPosition
} from "../../services/bibleReaderService";
import { trackEvent } from "../../services/analyticsService";
import { ContinueReadingCard } from "./ContinueReadingCard";
import { TestamentSection } from "./TestamentSection";

export function BibleBooksScreen() {
  const navigation = useNavigation<any>();
  const booksQuery = useQuery({ queryKey: ["bible-books-grouped"], queryFn: fetchBibleBooksGrouped });
  const positionQuery = useQuery({
    queryKey: ["bible-reading-position"],
    queryFn: fetchLastReadingPosition,
    // Reading position is per-user. Don't retry on auth errors.
    retry: false
  });
  const grouped = booksQuery.data;
  const position = positionQuery.data ?? null;

  const [oldExpanded, setOldExpanded] = useState(true);
  const [newExpanded, setNewExpanded] = useState(true);

  const handleSelectBook = (bookId: string, bookName: string) => {
    navigation.navigate("BibleChapters", { bookId, bookName });
  };

  const handleResume = () => {
    if (!position) return;
    void trackEvent("reading_resumed", {
      reference: position.verseNumber
        ? `${position.bookName} ${position.chapterNumber}:${position.verseNumber}`
        : `${position.bookName} ${position.chapterNumber}`
    });
    navigation.navigate("BibleVerses", {
      chapterId: position.chapterId,
      chapterLabel: `${position.bookName} ${position.chapterNumber}`,
      scrollToVerseId: position.verseId ?? undefined
    });
  };

  const isEmpty = !grouped || (grouped.oldTestament.length === 0 && grouped.newTestament.length === 0);

  return (
    <Screen
      title="Bible"
      subtitle="Browse the full canon. NIV placeholders render until licensing is approved."
    >
      <QueryStateBoundary
        isLoading={booksQuery.isLoading}
        isError={booksQuery.isError}
        isEmpty={isEmpty}
        loadingMessage="Loading the canon..."
        errorTitle="Unable to load books"
        errorMessage="Please try again."
        emptyTitle="No books available"
        emptyMessage="Bible content will appear once placeholder data is seeded."
        onRetry={() => void booksQuery.refetch()}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {position ? <ContinueReadingCard position={position} onPress={handleResume} /> : null}

          <ListRow
            label="Search verses"
            caption="Type a keyword or a reference like John 3:16"
            tone="soft"
            onPress={() => navigation.navigate("BibleSearch")}
            trailing="Search"
          />
          <View style={styles.spacer} />

          {grouped?.oldTestament.length ? (
            <TestamentSection
              title="Old Testament"
              caption="The promises, history, and poetry of Israel"
              groups={grouped.oldTestament}
              expanded={oldExpanded}
              onToggle={() => setOldExpanded((current) => !current)}
              onSelectBook={handleSelectBook}
            />
          ) : null}

          {grouped?.newTestament.length ? (
            <TestamentSection
              title="New Testament"
              caption="The life of Christ and the early church"
              groups={grouped.newTestament}
              expanded={newExpanded}
              onToggle={() => setNewExpanded((current) => !current)}
              onSelectBook={handleSelectBook}
            />
          ) : null}
        </ScrollView>
      </QueryStateBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.xxxl
  },
  spacer: {
    height: uiTheme.spacing.sm
  }
});
