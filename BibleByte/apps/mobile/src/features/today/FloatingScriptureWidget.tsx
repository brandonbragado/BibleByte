import { Alert, StyleSheet, Text, View } from "react-native";
import { uiTheme } from "@biblebites/ui";
import { Button } from "../../components/ui";
import type { ScriptureSpotlight } from "../../services/scriptureOfDayService";
import { shareVerse } from "../../services/shareService";

type Props = {
  spotlight: ScriptureSpotlight;
};

/**
 * Elevated “floating” spotlight card — random scripture-of-the-day (deterministic
 * per calendar day from the seeded verse pool).
 */
export function FloatingScriptureWidget({ spotlight }: Props) {
  const handleShare = async () => {
    try {
      await shareVerse({
        reference: spotlight.reference,
        text: spotlight.verseText,
        translation: "NIV",
        source: "today_spotlight"
      });
    } catch (error) {
      Alert.alert("Unable to share", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <View style={styles.wrapper} accessibilityRole="summary">
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Scripture spotlight</Text>
        <Text style={styles.reference}>{spotlight.reference}</Text>
        <Text style={styles.verse}>{spotlight.verseText}</Text>
        <Text style={styles.translation}>NIV · placeholder until licensing</Text>
        <View style={styles.actions}>
          <Button label="Share" variant="secondary" size="sm" onPress={() => void handleShare()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: uiTheme.spacing.md
  },
  glow: {
    position: "absolute",
    left: -2,
    right: -2,
    top: -6,
    bottom: -4,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "rgba(191, 148, 97, 0.14)"
  },
  card: {
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.parchment,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.md,
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadows.raised
  },
  eyebrow: {
    color: uiTheme.colors.gold,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    fontWeight: uiTheme.fontWeight.semibold,
    textTransform: "uppercase"
  },
  reference: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold
  },
  verse: {
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.body + 1,
    lineHeight: uiTheme.typography.lineHeight.relaxed,
    fontStyle: "italic"
  },
  translation: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption,
    fontWeight: uiTheme.fontWeight.medium
  },
  actions: {
    flexDirection: "row",
    marginTop: uiTheme.spacing.xs
  }
});
