import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { uiTheme } from "@biblebites/ui";
import { Button } from "./Button";

type VerseCardProps = {
  reference: string;
  text: string;
  translation?: string;
  /** Whether the verse is currently saved by the user. */
  isSaved?: boolean;
  /** Optional small badge above the reference (e.g. "VERSE OF THE DAY"). */
  eyebrow?: string;
  /** Toggle save callback. Hidden if not provided. */
  onToggleSave?: () => void | Promise<void>;
  /** Share callback. Hidden if not provided. */
  onShare?: () => void | Promise<void>;
  /** When the card is in a busy state (e.g. saving). */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * VerseCard - the signature BibleByte component for displaying scripture
 * in a calm, parchment-toned container with optional save/share controls.
 *
 * NIV is the only translation BibleByte renders; the translation prop defaults to "NIV"
 * and the badge is intentionally subtle to keep focus on the verse.
 *
 * TODO[NIV_LICENSE]: When NIV licensing is finalized, ensure attribution copy
 * (and any required copyright notice) is appended below the verse text.
 */
export function VerseCard({
  reference,
  text,
  translation = "NIV",
  isSaved = false,
  eyebrow,
  onToggleSave,
  onShare,
  busy = false,
  style
}: VerseCardProps) {
  return (
    <View accessibilityRole="summary" style={[styles.card, style]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={styles.reference}>{reference}</Text>
      <Text style={styles.verse}>{text}</Text>
      <Text style={styles.translation}>{translation}</Text>
      {(onToggleSave || onShare) ? (
        <View style={styles.actions}>
          {onToggleSave ? (
            <Button
              label={isSaved ? "Saved" : "Save"}
              onPress={onToggleSave}
              variant={isSaved ? "secondary" : "ghost"}
              size="sm"
              loading={busy}
              accessibilityLabel={isSaved ? "Remove from saved verses" : "Save this verse"}
            />
          ) : null}
          {onShare ? (
            <Button
              label="Share"
              onPress={onShare}
              variant="ghost"
              size="sm"
              accessibilityLabel="Share this verse"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: uiTheme.colors.parchment,
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadows.card
  },
  eyebrow: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    fontWeight: uiTheme.fontWeight.semibold
  },
  reference: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.h2,
    fontWeight: uiTheme.fontWeight.bold,
    letterSpacing: uiTheme.typography.letterSpacing.tight
  },
  verse: {
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.body + 2,
    lineHeight: uiTheme.typography.lineHeight.verse,
    fontStyle: "italic"
  },
  translation: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption,
    fontWeight: uiTheme.fontWeight.semibold,
    letterSpacing: uiTheme.typography.letterSpacing.wide
  },
  actions: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
    marginTop: uiTheme.spacing.sm
  }
});
