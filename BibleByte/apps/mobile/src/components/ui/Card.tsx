import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { uiTheme } from "@biblebites/ui";
import { motionScale, motionSpring } from "../../constants/motion";
import { usePressScale } from "../../hooks/usePressScale";
import { Button } from "./Button";

type CardTone = "default" | "soft" | "highlighted";

type CardProps = {
  title?: string;
  body?: string;
  eyebrow?: string;
  tone?: CardTone;
  /** When provided alongside `actionLabel`, renders an action button at the bottom of the card. */
  onPress?: () => void;
  actionLabel?: string;
  /** When provided (no `actionLabel`), the whole card becomes pressable. */
  onCardPress?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Card is a calm container with rounded corners, parchment surface,
 * and gentle shadow. Optional title/body/eyebrow allow drop-in usage,
 * while children compose richer layouts.
 *
 * Press semantics:
 * - `actionLabel` + `onPress` => bottom action button
 * - `onCardPress` => whole card pressable
 */
export function Card({
  title,
  body,
  eyebrow,
  tone = "default",
  onPress,
  actionLabel,
  onCardPress,
  children,
  style
}: CardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(!onCardPress, {
    pressedScale: motionScale.surfacePressed,
    spring: motionSpring.pressSoft
  });

  const containerStyle = [styles.base, toneStyles[tone].container, style];

  const content = (
    <>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      {title ? <Text style={[styles.title, toneStyles[tone].title]}>{title}</Text> : null}
      {body ? <Text style={[styles.body, toneStyles[tone].body]}>{body}</Text> : null}
      {children}
      {actionLabel && onPress ? (
        <Button label={actionLabel} onPress={onPress} variant="primary" size="sm" style={styles.actionButton} />
      ) : null}
    </>
  );

  if (onCardPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onCardPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[containerStyle, animatedStyle]}>{content}</Animated.View>
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1,
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
  title: {
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.semibold
  },
  body: {
    fontSize: uiTheme.typography.body,
    lineHeight: uiTheme.typography.lineHeight.normal
  },
  actionButton: {
    alignSelf: "flex-start",
    marginTop: uiTheme.spacing.xs
  }
});

const toneStyles: Record<CardTone, { container: ViewStyle; title: { color: string }; body: { color: string } }> = {
  default: {
    container: {
      backgroundColor: uiTheme.colors.parchment,
      borderColor: uiTheme.colors.border
    },
    title: { color: uiTheme.colors.deepOlive },
    body: { color: uiTheme.colors.olive }
  },
  soft: {
    container: {
      backgroundColor: uiTheme.colors.cream,
      borderColor: uiTheme.colors.divider
    },
    title: { color: uiTheme.colors.deepOlive },
    body: { color: uiTheme.colors.olive }
  },
  highlighted: {
    container: {
      backgroundColor: uiTheme.colors.deepOlive,
      borderColor: uiTheme.colors.moss
    },
    title: { color: uiTheme.colors.parchment },
    body: { color: uiTheme.colors.sand }
  }
};
