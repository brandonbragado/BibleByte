import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiTheme } from "@biblebites/ui";
import { ListRow } from "../../components/ui";
import type { BibleBookGroup } from "../../services/bibleReaderService";

type Props = {
  title: string;
  caption?: string;
  groups: BibleBookGroup[];
  expanded: boolean;
  onToggle: () => void;
  onSelectBook: (bookId: string, bookName: string) => void;
};

export function TestamentSection({ title, caption, groups, expanded, onToggle, onSelectBook }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
        <Text style={styles.chevron}>{expanded ? "Hide" : "Show"}</Text>
      </Pressable>

      {expanded
        ? groups.map((group) => (
            <View key={group.group} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.books.map((book) => (
                <ListRow
                  key={book.id}
                  label={book.name}
                  onPress={() => onSelectBook(book.id, book.name)}
                  trailing="Read"
                />
              ))}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: uiTheme.spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.xs
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  title: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold
  },
  caption: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption
  },
  chevron: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: uiTheme.fontWeight.semibold
  },
  group: {
    marginTop: uiTheme.spacing.xs,
    marginBottom: uiTheme.spacing.sm
  },
  groupLabel: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    textTransform: "uppercase",
    fontWeight: uiTheme.fontWeight.semibold,
    paddingHorizontal: uiTheme.spacing.xs,
    paddingBottom: uiTheme.spacing.xs
  }
});
