import Link from "next/link";

import { updatePreferences } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

export async function PreferencesCard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Experience</CardTitle>
          <CardDescription>Sign in to manage reminders and analytics consent.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("analytics_opt_in, reminder_enabled, reminder_wall_time")
    .eq("id", user.id)
    .maybeSingle();

  const analyticsOptIn = Boolean(profile?.analytics_opt_in);
  const reminderEnabled = Boolean(profile?.reminder_enabled);
  const rawTime = profile?.reminder_wall_time;
  const wallTime =
    typeof rawTime === "string"
      ? rawTime.slice(0, 5)
      : rawTime != null
        ? String(rawTime).slice(0, 5)
        : "";

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl">Experience</CardTitle>
        <CardDescription>
          {/* TODO[APNs_FCM]: Reminder sends once tokens exist */}
          Analytics is opt-in. Reminder times follow your browser clock until timezone-aware scheduling ships alongside native push notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updatePreferences} className="space-y-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
            <input
              type="checkbox"
              name="analytics_opt_in"
              value="on"
              defaultChecked={analyticsOptIn}
              className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
            />
            <span className="text-sm leading-relaxed text-foreground">
              <span className="font-medium">Share anonymous usage analytics</span>
              <span className="mt-1 block text-muted-foreground">
                Helps prioritize improvements—never includes scripture text or prayer contents.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
            <input
              type="checkbox"
              name="reminder_enabled"
              value="on"
              defaultChecked={reminderEnabled}
              className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
            />
            <span className="text-sm leading-relaxed text-foreground">
              <span className="font-medium">Daily reminder preference</span>
              <span className="mt-1 block text-muted-foreground">
                {/* TODO[WidgetKit_Android]: verse snippet + reminders */}
                Stored as a preferred clock time; native notifications activate once Expo registers device tokens.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <label htmlFor="reminder_wall_time" className="text-sm font-medium">
              Preferred reminder time
            </label>
            <Input id="reminder_wall_time" type="time" name="reminder_wall_time" defaultValue={wallTime} />
          </div>

          <Button type="submit">Save preferences</Button>
        </form>
      </CardContent>
    </Card>
  );
}
