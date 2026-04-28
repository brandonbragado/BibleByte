import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiTheme } from "@biblebites/ui";
import type { ReadingPosition } from "../../services/bibleReaderService";

type Props = {
  position: ReadingPosition;
  onPress: () => void;
};

export function ContinueReadingCard({ position, onPress }: Props) {
  const reference = position.verseNumber
    ? `${position.bookName} ${position.chapterNumber}:${position.verseNumber}`
    : `${position.bookName} ${position.chapterNumber}`;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Text style={styles.eyebrow}>Continue reading</Text>
      <Text style={styles.reference}>{reference}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>Pick up where you left off</Text>
        <Text style={styles.cta}>Open ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: uiTheme.colors.deepOlive,
    borderRadius: uiTheme.radius.lg,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.md,
    marginBottom: uiTheme.spacing.md,
    gap: uiTheme.spacing.xxs,
    ...uiTheme.shadows.raised
  },
  eyebrow: {
    color: uiTheme.colors.sand,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    textTransform: "uppercase",
    fontWeight: uiTheme.fontWeight.semibold
  },
  reference: {
    color: uiTheme.colors.parchment,
    fontSize: uiTheme.typography.h2,
    fontWeight: uiTheme.fontWeight.bold
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: uiTheme.spacing.xs
  },
  metaText: {
    color: uiTheme.colors.sand,
    fontSize: uiTheme.typography.bodySmall
  },
  cta: {
    color: uiTheme.colors.parchment,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: uiTheme.fontWeight.semibold
  }
});
