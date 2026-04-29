"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { SignInCard } from "@/components/auth/sign-in-card";
import { ThemeModeSelect } from "@/components/theme-mode-select";

type Props = {
  nextPath: string;
};

export function LoginEntrance({ nextPath }: Props) {
  const reduceMotion = useReducedMotion();

  const soft = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  const stagger = reduceMotion
    ? { staggerChildren: 0, delayChildren: 0 }
    : { staggerChildren: 0.09, delayChildren: 0.06 };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeModeSelect compact />
      </div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,111,82,0.12)_0%,_transparent_52%),radial-gradient(ellipse_at_bottom,_rgba(201,168,78,0.07)_0%,_transparent_48%)]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.9, ease: "easeOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-[20%] top-1/4 h-[min(420px,50vh)] w-[min(420px,80vw)] rounded-full bg-primary/[0.09] blur-[100px]"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...soft, delay: reduceMotion ? 0 : 0.05 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-[15%] bottom-[20%] h-[min(380px,45vh)] w-[min(380px,75vw)] rounded-full bg-gold/[0.1] blur-[90px]"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...soft, delay: reduceMotion ? 0 : 0.12 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md sm:max-w-lg"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: reduceMotion ? 1 : 0 },
          show: {
            opacity: 1,
            transition: stagger,
          },
        }}
      >
        <motion.div
          className="mb-10 text-center"
          variants={{
            hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
            show: { opacity: 1, y: 0, transition: soft },
          }}
        >
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="inline-block"
          >
            <Link
              href="/"
              className="font-display text-2xl font-semibold text-primary transition-opacity hover:opacity-90"
            >
              BibleByte
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
            show: {
              opacity: 1,
              y: 0,
              transition: { ...soft, delay: reduceMotion ? 0 : 0.06 },
            },
          }}
        >
          <SignInCard nextPath={nextPath} />
        </motion.div>

        <motion.p
          className="mt-8 text-center text-xs text-muted-foreground"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { ...soft, delay: reduceMotion ? 0 : 0.28 } },
          }}
        >
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            ← Back to home
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
