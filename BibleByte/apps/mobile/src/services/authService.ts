import * as WebBrowser from "expo-web-browser";
import { authRedirectPath, buildAuthRedirectUri, passwordResetRedirectPath } from "../constants/auth";
import { supabase } from "./supabase/client";

WebBrowser.maybeCompleteAuthSession();

/** Query + fragment params from Supabase OAuth redirect (PKCE uses ?code=; implicit may use #access_token=). */
function paramsFromOAuthRedirectUrl(callbackUrl: string): URLSearchParams {
  let url: URL;
  try {
    url = new URL(callbackUrl);
  } catch {
    throw new Error("Invalid OAuth redirect URL.");
  }
  const merged = new URLSearchParams(url.search);
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (hash) {
    const fromHash = new URLSearchParams(hash);
    fromHash.forEach((value, key) => {
      merged.set(key, value);
    });
  }
  return merged;
}

async function completeSessionFromOAuthRedirect(callbackUrl: string): Promise<void> {
  const params = paramsFromOAuthRedirectUrl(callbackUrl);
  const oauthError = params.get("error");
  if (oauthError) {
    throw new Error(params.get("error_description") ?? oauthError);
  }

  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) {
      throw error;
    }
    return;
  }

  throw new Error("Sign-in redirect did not include a session. Check Supabase redirect URLs and OAuth provider settings.");
}

async function signInWithOAuth(provider: "google" | "apple"): Promise<void> {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Auth is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env.");
  }

  const redirectTo = buildAuthRedirectUri(authRedirectPath);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    if (provider === "google") {
      throw new Error(
        `Google sign-in setup issue: ${error.message}. Confirm Google OAuth is enabled in Supabase and add redirect URI "${redirectTo}" in both Supabase Auth settings and Google Cloud OAuth client.`
      );
    }
    throw error;
  }

  if (!data?.url) {
    throw new Error(`Missing OAuth URL for provider ${provider}`);
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") {
    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error(`${provider[0].toUpperCase() + provider.slice(1)} sign-in was cancelled.`);
    }
    throw new Error(
      `${provider[0].toUpperCase() + provider.slice(1)} sign-in failed before callback. Check redirect configuration for "${redirectTo}".`
    );
  }

  await completeSessionFromOAuthRedirect(result.url);
}

export async function signInWithApple(): Promise<void> {
  await signInWithOAuth("apple");
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithOAuth("google");
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ hasActiveSession: boolean; requiresEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw error;
  }

  return {
    hasActiveSession: Boolean(data.session),
    requiresEmailConfirmation: !data.session
  } as const;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = buildAuthRedirectUri(passwordResetRedirectPath);
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw error;
  }
}
