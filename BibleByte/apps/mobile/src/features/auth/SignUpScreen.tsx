import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import { Button, Input, Screen } from "../../components/ui";
import { signInWithApple, signInWithGoogle, signUpWithEmail } from "../../services/authService";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const oauthOrEmailBusy = busy || busyProvider !== null;

  const validate = () => {
    if (!email.trim() || !password) {
      setErrorText("Email and password are required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorText("That doesn't look like a valid email.");
      return false;
    }
    if (password.length < 8) {
      setErrorText("Password must be at least 8 characters.");
      return false;
    }
    setErrorText(null);
    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) {
      return;
    }
    setBusy(true);
    try {
      const result = await signUpWithEmail(email.trim(), password);
      if (result.requiresEmailConfirmation) {
        Alert.alert(
          "Check your email",
          "We sent a confirmation link to finish creating your account. After confirming, sign in with your password."
        );
        navigation.replace("SignIn");
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  };

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
        "Sign up didn't complete",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <Screen title="Create account" subtitle="Begin a calm daily rhythm with BibleByte.">
      <View style={styles.form}>
        <Button
          label={busyProvider === "google" ? "Opening Google..." : "Continue with Google"}
          onPress={() => handleProvider("google")}
          variant="primary"
          size="lg"
          loading={busyProvider === "google"}
          disabled={oauthOrEmailBusy && busyProvider !== "google"}
          fullWidth
        />
        <Button
          label={busyProvider === "apple" ? "Opening Apple..." : "Continue with Apple"}
          onPress={() => handleProvider("apple")}
          variant="secondary"
          size="lg"
          loading={busyProvider === "apple"}
          disabled={oauthOrEmailBusy && busyProvider !== "apple"}
          fullWidth
        />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or create with email</Text>
          <View style={styles.dividerLine} />
        </View>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!oauthOrEmailBusy}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="password"
          hint="Use a private passphrase you'll remember."
          editable={!oauthOrEmailBusy}
        />
        {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        <Button
          label={busy ? "Creating..." : "Create account"}
          onPress={handleSignUp}
          variant="primary"
          size="lg"
          loading={busy}
          disabled={oauthOrEmailBusy}
          fullWidth
        />
      </View>

      <Text style={styles.altPrompt}>
        Already have an account?{" "}
        <Text style={styles.altLink} onPress={() => navigation.replace("SignIn")}>
          Sign in
        </Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: uiTheme.spacing.md,
    gap: uiTheme.spacing.sm
  },
  error: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption
  },
  altPrompt: {
    marginTop: uiTheme.spacing.xl,
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.body,
    textAlign: "center"
  },
  altLink: {
    color: uiTheme.colors.deepOlive,
    fontWeight: uiTheme.fontWeight.bold
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
  }
});
