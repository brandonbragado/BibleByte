import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { uiTheme } from "@biblebites/ui";

type ScreenProps = {
  title?: string;
  subtitle?: string;
  /** When true, content is wrapped in a ScrollView (false by default; many screens manage their own scroll). */
  scroll?: boolean;
  /** When true, omits safe-area top padding (e.g. for full-bleed splash). */
  bleed?: boolean;
  /** Optional persistent header element rendered above the title. */
  header?: ReactNode;
  /** Optional sticky footer rendered outside of any scrollview. */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * The Screen primitive establishes BibleByte's calm, ivory-on-olive layout.
 * It owns padding, safe area, optional scroll, and standard title/subtitle.
 */
export function Screen({ title, subtitle, scroll = false, bleed = false, header, footer, children }: ScreenProps) {
  const titleEnter = FadeInDown.duration(320);
  const bodyEnter = FadeIn.delay(72).duration(280);

  const titleBlock = title || subtitle ? (
    <Animated.View entering={titleEnter} style={styles.titleBlock}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Animated.View>
  ) : null;

  const animatedBody = (
    <Animated.View entering={bodyEnter} style={scroll ? styles.scrollBody : styles.viewBody}>
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={bleed ? ["bottom"] : ["top", "bottom"]}>
      <View style={styles.container}>
        {header ? <View style={styles.header}>{header}</View> : null}
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {titleBlock}
            {animatedBody}
          </ScrollView>
        ) : (
          <View style={styles.viewContent}>
            {titleBlock}
            {animatedBody}
          </View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: uiTheme.colors.ivory
  },
  container: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg
  },
  header: {
    paddingTop: uiTheme.spacing.md
  },
  titleBlock: {
    paddingTop: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.md,
    gap: uiTheme.spacing.xs
  },
  title: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.h1,
    fontWeight: uiTheme.fontWeight.heavy,
    letterSpacing: uiTheme.typography.letterSpacing.tight
  },
  subtitle: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.body,
    lineHeight: uiTheme.typography.lineHeight.normal
  },
  scrollContent: {
    paddingBottom: uiTheme.spacing.xxxl,
    gap: uiTheme.spacing.md
  },
  scrollBody: {
    gap: uiTheme.spacing.md
  },
  viewContent: {
    flex: 1,
    gap: uiTheme.spacing.md
  },
  viewBody: {
    flex: 1,
    gap: uiTheme.spacing.md
  },
  footer: {
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.md
  }
});
