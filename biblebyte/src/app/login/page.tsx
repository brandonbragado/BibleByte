import Link from "next/link";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next ?? "/home";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,111,82,0.1)_0%,_transparent_50%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-primary transition-opacity hover:opacity-90"
          >
            BibleByte
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to continue your daily rhythm.
          </p>
        </div>

        <Card className="border-primary/10 bg-card/90 shadow-soft backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Choose a provider to continue. We never post on your behalf.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <OAuthButtons nextPath={nextPath} />
            <p className="text-center text-xs text-muted-foreground">
              New here? Your spiritual profile will be created on first sign-in.
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
