import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { HighlightColor } from "@biblebites/contracts";
import { uiTheme } from "@biblebites/ui";
import { Button } from "../../components/ui";
import { HIGHLIGHT_TOKENS } from "./highlightTokens";

type VerseActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  reference: string;
  verseText: string;
  isSaved: boolean;
  currentHighlight: HighlightColor | null;
  onToggleSave: () => void;
  onSelectHighlight: (color: HighlightColor) => void;
  onClearHighlight: () => void;
  onShare: () => void;
  onCopy: () => void;
  isSavePending?: boolean;
};

export function VerseActionSheet({
  visible,
  onClose,
  reference,
  verseText,
  isSaved,
  currentHighlight,
  onToggleSave,
  onSelectHighlight,
  onClearHighlight,
  onShare,
  onCopy,
  isSavePending
}: VerseActionSheetProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.scrim} accessibilityRole="button" onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <View style={styles.sheet} accessibilityRole="menu">
          <View style={styles.handle} />
          <Text style={styles.reference}>{reference}</Text>
          <Text style={styles.preview} numberOfLines={3}>
            {verseText}
          </Text>

          <Text style={styles.sectionLabel}>Highlight</Text>
          <View style={styles.swatchRow}>
            {HIGHLIGHT_TOKENS.map((token) => {
              const selected = currentHighlight === token.color;
              return (
                <Pressable
                  key={token.color}
                  accessibilityRole="button"
                  accessibilityLabel={`Highlight ${token.label}`}
                  accessibilityState={{ selected }}
                  onPress={() => onSelectHighlight(token.color)}
                  style={[
                    styles.swatch,
                    { backgroundColor: token.swatch },
                    selected ? styles.swatchSelected : null
                  ]}
                />
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove highlight"
              onPress={onClearHighlight}
              style={[styles.swatch, styles.swatchClear, currentHighlight ? null : styles.swatchClearDisabled]}
              disabled={!currentHighlight}
            >
              <Text style={styles.swatchClearLabel}>None</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Button
              label={isSaved ? "Saved · Tap to remove" : "Save verse"}
              variant={isSaved ? "ghost" : "primary"}
              size="md"
              fullWidth
              onPress={onToggleSave}
              loading={isSavePending}
            />
            <Button label="Share" variant="ghost" size="md" fullWidth onPress={onShare} />
            <Button label="Copy reference" variant="ghost" size="md" fullWidth onPress={onCopy} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={onClose}
            style={styles.closeRow}
          >
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(44, 42, 34, 0.45)"
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    pointerEvents: "box-none"
  },
  sheet: {
    backgroundColor: uiTheme.colors.parchment,
    borderTopLeftRadius: uiTheme.radius.xl,
    borderTopRightRadius: uiTheme.radius.xl,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xl,
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadows.raised
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: uiTheme.colors.divider,
    marginBottom: uiTheme.spacing.xs
  },
  reference: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold
  },
  preview: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: uiTheme.typography.lineHeight.tight
  },
  sectionLabel: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.overline,
    letterSpacing: uiTheme.typography.letterSpacing.overline,
    fontWeight: uiTheme.fontWeight.semibold,
    textTransform: "uppercase",
    marginTop: uiTheme.spacing.xs
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center"
  },
  swatchSelected: {
    borderColor: uiTheme.colors.deepOlive
  },
  swatchClear: {
    backgroundColor: uiTheme.colors.cream,
    borderColor: uiTheme.colors.border,
    paddingHorizontal: uiTheme.spacing.sm,
    width: undefined,
    minWidth: 64
  },
  swatchClearDisabled: {
    opacity: 0.5
  },
  swatchClearLabel: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.caption,
    fontWeight: uiTheme.fontWeight.semibold
  },
  actions: {
    gap: uiTheme.spacing.xs,
    marginTop: uiTheme.spacing.sm
  },
  closeRow: {
    alignSelf: "center",
    paddingVertical: uiTheme.spacing.xs,
    paddingHorizontal: uiTheme.spacing.md
  },
  closeLabel: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: uiTheme.fontWeight.semibold
  }
});
