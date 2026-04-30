"use client";

import { useActionState } from "react";

import { updateProfileIdentity, type UpdateProfileIdentityResult } from "@/app/(main)/profile/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileBio: string;
  profileMonthlyFocus: string;
};

export function ProfileIdentityForm({
  email,
  firstName,
  lastName,
  phone,
  profileBio,
  profileMonthlyFocus,
}: Props) {
  const [state, formAction, pending] = useActionState<
    UpdateProfileIdentityResult | null,
    FormData
  >(updateProfileIdentity, null);

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl">Your information</CardTitle>
        <CardDescription>
          We use your first name on Home. Bio and monthly focus are optional and only shown here unless you
          choose to share them later. Email lives on your Supabase account—changing it may require confirmation
          depending on your project&apos;s auth settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium text-foreground">
                First name
              </label>
              <Input
                id="first_name"
                name="first_name"
                required
                autoComplete="given-name"
                defaultValue={firstName}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="last_name" className="text-sm font-medium text-foreground">
                Last name
              </label>
              <Input
                id="last_name"
                name="last_name"
                autoComplete="family-name"
                defaultValue={lastName}
                disabled={pending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={email}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 …"
              defaultValue={phone}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile_bio" className="text-sm font-medium text-foreground">
              Short bio <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="profile_bio"
              name="profile_bio"
              maxLength={2000}
              placeholder="A line or two about what you’re leaning into…"
              defaultValue={profileBio}
              disabled={pending}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile_monthly_focus" className="text-sm font-medium text-foreground">
              This month&apos;s focus <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="profile_monthly_focus"
              name="profile_monthly_focus"
              maxLength={500}
              placeholder="What you want to be mindful of this month…"
              defaultValue={profileMonthlyFocus}
              disabled={pending}
              className="min-h-[80px]"
            />
          </div>
          {state?.ok === false ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="text-sm font-medium text-primary" role="status">
              Saved.
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
