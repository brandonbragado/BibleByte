import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { uiTheme } from "@biblebites/ui";
import { motionScale, motionSpring } from "../../constants/motion";
import { usePressScale } from "../../hooks/usePressScale";

type ListRowProps = {
  label: string;
  caption?: string;
  trailing?: string;
  tone?: "default" | "soft";
  onPress?: () => void;
};

export function ListRow({ label, caption, trailing, tone = "default", onPress }: ListRowProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(!onPress, {
    pressedScale: motionScale.surfacePressed,
    spring: motionSpring.pressSoft
  });

  const rowStyle = [styles.row, tone === "soft" ? styles.softRow : null];

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View style={[rowStyle, animatedStyle]}>
          <RowContent label={label} caption={caption} trailing={trailing} />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={rowStyle}>
      <RowContent label={label} caption={caption} trailing={trailing} />
    </View>
  );
}

function RowContent({ label, caption, trailing }: { label: string; caption?: string; trailing?: string }) {
  return (
    <>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.parchment,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.sm,
    marginBottom: uiTheme.spacing.xs,
    ...uiTheme.shadows.card
  },
  softRow: {
    backgroundColor: uiTheme.colors.cream
  },
  textBlock: {
    flex: 1,
    gap: 2
  },
  label: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.body,
    fontWeight: uiTheme.fontWeight.semibold
  },
  caption: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption
  },
  trailing: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: uiTheme.fontWeight.semibold
  }
});
