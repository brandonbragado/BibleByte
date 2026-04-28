"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  nextPath?: string;
};

export function OAuthButtons({ nextPath = "/home" }: Props) {
  const [pending, setPending] = useState<string | null>(null);

  async function signIn(provider: "google" | "apple") {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    setPending(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });
    setPending(null);
    if (error) {
      console.error(error.message);
      alert(`Could not start ${provider} sign-in. Check Supabase OAuth configuration.`);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        variant="default"
        className="w-full"
        disabled={pending !== null}
        onClick={() => signIn("google")}
      >
        {pending === "google" ? "Opening Google…" : "Continue with Google"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full border-primary/25 bg-background/70"
        disabled={pending !== null}
        onClick={() => signIn("apple")}
      >
        {pending === "apple" ? "Opening Apple…" : "Continue with Apple"}
      </Button>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Secure authentication powered by Supabase. Apple Sign In availability depends on your platform and Supabase provider setup.
      </p>
    </div>
  );
}
