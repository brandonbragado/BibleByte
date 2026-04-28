import { Alert, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import { Button, Screen } from "../../components/ui";
import { signInWithApple, signInWithGoogle } from "../../services/authService";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { useState } from "react";

type Props = NativeStackScreenProps<RootStackParamList, "AuthWelcome">;

export function WelcomeScreen({ navigation }: Props) {
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null);

  const handleProvider = async (provider: "google" | "apple") => {
    setBusyProvider(provider);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
    } catch (error) {
      Alert.alert(
        "Sign in didn't complete",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <Screen bleed>
      <View style={styles.hero}>
        <Text style={styles.brand}>BibleByte</Text>
        <Text style={styles.tagline}>A small daily scripture,{"\n"}beautifully delivered.</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={busyProvider === "google" ? "Opening Google..." : "Continue with Google"}
          onPress={() => handleProvider("google")}
          variant="primary"
          size="lg"
          loading={busyProvider === "google"}
          disabled={busyProvider !== null}
          fullWidth
        />
        <Button
          label={busyProvider === "apple" ? "Opening Apple..." : "Continue with Apple"}
          onPress={() => handleProvider("apple")}
          variant="secondary"
          size="lg"
          loading={busyProvider === "apple"}
          disabled={busyProvider !== null}
          fullWidth
        />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use email</Text>
          <View style={styles.dividerLine} />
        </View>
        <Button
          label="Sign in with email"
          onPress={() => navigation.navigate("SignIn")}
          variant="ghost"
          size="md"
          fullWidth
        />
        <Button
          label="Create account"
          onPress={() => navigation.navigate("SignUp")}
          variant="ghost"
          size="md"
          fullWidth
        />
      </View>
      <Text style={styles.legal}>
        By continuing you agree to BibleByte's terms and privacy practices. NIV scripture is presented
        with placeholders during MVP and will be replaced with licensed content before launch.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: uiTheme.spacing.xxl,
    gap: uiTheme.spacing.sm
  },
  brand: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.display + 6,
    fontWeight: uiTheme.fontWeight.heavy,
    letterSpacing: -0.4
  },
  tagline: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.title,
    lineHeight: uiTheme.typography.lineHeight.relaxed
  },
  actions: {
    marginTop: uiTheme.spacing.xxl,
    gap: uiTheme.spacing.sm
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    marginVertical: uiTheme.spacing.sm
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: uiTheme.colors.divider
  },
  dividerText: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption,
    letterSpacing: uiTheme.typography.letterSpacing.wide
  },
  legal: {
    marginTop: "auto",
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption,
    lineHeight: uiTheme.typography.lineHeight.tight,
    paddingBottom: uiTheme.spacing.md
  }
});
