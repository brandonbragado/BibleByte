import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/(main)/settings/actions";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { PreferencesCard } from "@/components/settings/preferences-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-8 pt-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
          Settings
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Preferences & privacy
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {/* TODO[NIV_LICENSE]: Surfacing publisher attribution */}
          Manage reminders, analytics consent, and snippet payloads—native Expo builds extend this shell.
        </p>
      </header>

      <PreferencesCard />

      <DeleteAccountSection />

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Privacy</CardTitle>
          <CardDescription>
            Scripture placeholders remain licensing-safe until publisher workflows clear—never paste copyrighted text without clearance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted/60 px-4 py-4 text-sm text-muted-foreground ring-1 ring-border/60">
            Translation preference UI will honor publisher licensing workflows—never ship copyrighted text without clearance.
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile">Back to profile snapshot</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Session</CardTitle>
          <CardDescription>Secure Supabase-managed cookies.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="destructive" className="gap-2">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
