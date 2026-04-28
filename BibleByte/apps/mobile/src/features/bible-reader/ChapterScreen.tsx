import { ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import { ListRow, Screen } from "../../components/ui";
import { QueryStateBoundary } from "../../components/QueryStateBoundary";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { fetchChaptersByBook } from "../../services/bibleReaderService";

type Props = NativeStackScreenProps<RootStackParamList, "BibleChapters">;

export function ChapterScreen({ navigation, route }: Props) {
  const { bookId, bookName } = route.params;
  const chaptersQuery = useQuery({
    queryKey: ["bible-chapters", bookId],
    queryFn: () => fetchChaptersByBook(bookId)
  });
  const chapters = chaptersQuery.data ?? [];

  return (
    <Screen title={bookName} subtitle="Choose a chapter">
      <QueryStateBoundary
        isLoading={chaptersQuery.isLoading}
        isError={chaptersQuery.isError}
        isEmpty={chapters.length === 0}
        loadingMessage="Loading chapters..."
        errorTitle="Unable to load chapters"
        errorMessage="Please try again."
        emptyTitle="No chapters yet"
        emptyMessage="No chapter records were found for this book."
        onRetry={() => void chaptersQuery.refetch()}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {chapters.map((chapter) => (
            <ListRow
              key={chapter.id}
              label={`Chapter ${chapter.chapterNumber}`}
              onPress={() =>
                navigation.navigate("BibleVerses", {
                  chapterId: chapter.id,
                  chapterLabel: `${bookName} ${chapter.chapterNumber}`
                })
              }
              trailing="Read"
            />
          ))}
        </ScrollView>
      </QueryStateBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.xxxl
  }
});
