"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  nextPath?: string;
};

export function OAuthButtons({ nextPath = "/home" }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anon) {
      setError(
        "Supabase env vars are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server."
      );
      return;
    }

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    setPending(true);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        console.error(oauthError);
        setError(oauthError.message);
        return;
      }

      if (!data?.url) {
        setError(
          "Supabase did not return a login URL. In the dashboard: Authentication → Providers — enable Google and under URL Configuration allow this callback (e.g. http://localhost:3000/auth/callback**)."
        );
        return;
      }

      window.location.assign(data.url);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not start sign-in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        variant="default"
        className="w-full"
        disabled={pending}
        onClick={() => void signInWithGoogle()}
      >
        {pending ? "Opening Google…" : "Continue with Google"}
      </Button>
      {error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-[12px] leading-snug text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Secure authentication powered by Supabase.
      </p>
    </div>
  );
}
