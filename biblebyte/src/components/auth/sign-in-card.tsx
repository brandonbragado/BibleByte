"use client";

import { motion, useReducedMotion } from "framer-motion";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  nextPath: string;
  /** When false, skip built-in OAuth row fade (parent drives stagger). */
  selfAnimateOAuth?: boolean;
};

export function SignInCard({ nextPath, selfAnimateOAuth = true }: Props) {
  const reduceMotion = useReducedMotion();
  const soft = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  const buttons = <OAuthButtons nextPath={nextPath} />;

  return (
    <Card className="border-primary/10 bg-card/90 shadow-soft backdrop-blur-md">
      <CardHeader className="space-y-1">
        <CardTitle className="font-display text-2xl">Login</CardTitle>
        <CardDescription>Sign in with Google to continue. We never post on your behalf.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {selfAnimateOAuth ? (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...soft, delay: reduceMotion ? 0 : 0.12 }}
          >
            {buttons}
          </motion.div>
        ) : (
          buttons
        )}
        <p className="text-center text-xs text-muted-foreground">
          New here? Your spiritual profile will be created on first sign-in.
        </p>
      </CardContent>
    </Card>
  );
}
