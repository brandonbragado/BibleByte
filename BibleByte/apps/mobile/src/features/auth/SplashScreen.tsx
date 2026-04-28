import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../stores/authStore";
import { hasCompletedOnboarding } from "../../services/onboardingService";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  const authStatus = useAuthStore((state) => state.status);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]),
      Animated.timing(copyOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(300)
    ]).start(() => setAnimationComplete(true));
  }, [copyOpacity, logoOpacity, logoScale]);

  useEffect(() => {
    if (!isHydrated || !animationComplete || hasNavigated.current) {
      return;
    }

    const routeFromAuth = async () => {
      hasNavigated.current = true;
      if (authStatus === "authenticated") {
        try {
          const completed = await hasCompletedOnboarding();
          if (completed) {
            navigation.replace("MainTabs", { screen: "Today" });
          } else {
            navigation.replace("Goal");
          }
        } catch {
          navigation.replace("Goal");
        }
        return;
      }
      navigation.replace("AuthWelcome");
    };

    void routeFromAuth();
  }, [animationComplete, authStatus, isHydrated, navigation]);

  return (
    <View style={styles.container} accessibilityRole="summary" accessibilityLabel="BibleByte splash">
      <Animated.View style={[styles.brandWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Text style={styles.brand}>BibleByte</Text>
        <Text style={styles.tagline}>A small daily scripture, beautifully delivered.</Text>
      </Animated.View>
      <Animated.Text style={[styles.loadingCopy, { opacity: copyOpacity }]}>Preparing your verse...</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiTheme.colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    padding: uiTheme.spacing.lg
  },
  brandWrap: {
    alignItems: "center",
    gap: uiTheme.spacing.sm
  },
  brand: {
    color: uiTheme.colors.deepOlive,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -0.4
  },
  tagline: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.body,
    textAlign: "center",
    paddingHorizontal: uiTheme.spacing.lg
  },
  loadingCopy: {
    marginTop: uiTheme.spacing.xl,
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.bodySmall
  }
});
