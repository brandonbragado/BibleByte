import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { uiTheme } from "@biblebites/ui";
import { usePressScale } from "../../hooks/usePressScale";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * BibleByte Button - olive-on-ivory primary, soft sand secondary, and warm ghost.
 * All variants share consistent radius, type weight, and tap targets.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  fullWidth,
  iconLeft,
  iconRight,
  accessibilityLabel,
  style,
  textStyle
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(Boolean(isDisabled));

  const containerStyle = [
    styles.base,
    sizeStyles[size].container,
    variantStyles[variant].container,
    fullWidth ? styles.fullWidth : null,
    isDisabled ? styles.disabled : null,
    style
  ];
  const labelStyle = [styles.label, sizeStyles[size].label, variantStyles[variant].label, textStyle];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={isDisabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => {
        const result = onPress();
        if (result && typeof (result as Promise<void>).then === "function") {
          void result;
        }
      }}
      style={fullWidth ? styles.fullWidthOuter : undefined}
    >
      <Animated.View style={[containerStyle, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color={variantStyles[variant].spinner} />
        ) : (
          <>
            {iconLeft ? <>{iconLeft}</> : null}
            <Text style={labelStyle}>{label}</Text>
            {iconRight ? <>{iconRight}</> : null}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.pill,
    borderWidth: 1,
    borderColor: "transparent"
  },
  fullWidth: {
    alignSelf: "stretch"
  },
  fullWidthOuter: {
    alignSelf: "stretch"
  },
  disabled: {
    opacity: 0.55
  },
  label: {
    fontWeight: uiTheme.fontWeight.semibold
  }
});

const sizeStyles = {
  sm: StyleSheet.create({
    container: { minHeight: 40, paddingHorizontal: uiTheme.spacing.md },
    label: { fontSize: uiTheme.typography.bodySmall }
  }),
  md: StyleSheet.create({
    container: { minHeight: 48, paddingHorizontal: uiTheme.spacing.lg },
    label: { fontSize: uiTheme.typography.body }
  }),
  lg: StyleSheet.create({
    container: { minHeight: 56, paddingHorizontal: uiTheme.spacing.lg },
    label: { fontSize: uiTheme.typography.title, fontWeight: uiTheme.fontWeight.bold }
  })
};

const variantStyles = {
  primary: {
    container: {
      backgroundColor: uiTheme.colors.deepOlive,
      borderColor: uiTheme.colors.deepOlive
    } satisfies ViewStyle,
    label: { color: uiTheme.colors.parchment } satisfies TextStyle,
    spinner: uiTheme.colors.parchment
  },
  secondary: {
    container: {
      backgroundColor: uiTheme.colors.sand,
      borderColor: uiTheme.colors.border
    } satisfies ViewStyle,
    label: { color: uiTheme.colors.deepOlive } satisfies TextStyle,
    spinner: uiTheme.colors.deepOlive
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
      borderColor: uiTheme.colors.border
    } satisfies ViewStyle,
    label: { color: uiTheme.colors.deepOlive } satisfies TextStyle,
    spinner: uiTheme.colors.deepOlive
  },
  danger: {
    container: {
      backgroundColor: "transparent",
      borderColor: uiTheme.colors.danger
    } satisfies ViewStyle,
    label: { color: uiTheme.colors.danger } satisfies TextStyle,
    spinner: uiTheme.colors.danger
  }
};
