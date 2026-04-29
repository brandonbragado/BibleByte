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

type Props = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export function ProfileIdentityForm({ email, firstName, lastName, phone }: Props) {
  const [state, formAction, pending] = useActionState<
    UpdateProfileIdentityResult | null,
    FormData
  >(updateProfileIdentity, null);

  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl">Your information</CardTitle>
        <CardDescription>
          We use your first name on Home. Email is stored with your Supabase account—changing it may require
          confirmation depending on your project&apos;s auth settings.
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
