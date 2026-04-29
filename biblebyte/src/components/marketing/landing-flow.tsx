"use client";

import { motion, useReducedMotion } from "framer-motion";

import { SignInCard } from "@/components/auth/sign-in-card";
import { ThemeModeSelect } from "@/components/theme-mode-select";

const easeOut = [0.22, 1, 0.36, 1] as const;

type Props = {
  nextPath?: string;
};

export function LandingFlow({ nextPath = "/home" }: Props) {
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion ? true : false;

  /**
   * Timeline (full motion): soft ambient → wordmark → eyebrow → headline → body
   * → OAuth card (slow, separate beat) → trust line.
   */
  const t = {
    wordmark: { d: 0, dur: instant ? 0.01 : 0.95 },
    eyebrow: { d: instant ? 0 : 0.4, dur: instant ? 0.01 : 1.05 },
    headline: { d: instant ? 0 : 1.35, dur: instant ? 0.01 : 1.2 },
    body: { d: instant ? 0 : 2.75, dur: instant ? 0.01 : 1.15 },
    card: { d: instant ? 0 : 4.05, dur: instant ? 0.01 : 1.25 },
    trust: { d: instant ? 0 : 5.45, dur: instant ? 0.01 : 0.8 },
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom,color-mix(in_srgb,var(--gold)_10%,transparent)_0%,transparent_50%)]"
        aria-hidden
      />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeModeSelect compact />
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_12%,transparent)_0%,transparent_52%),radial-gradient(ellipse_at_bottom,color-mix(in_srgb,var(--gold)_8%,transparent)_0%,transparent_48%)]"
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: instant ? 0.01 : 1.1, ease: "easeOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-[20%] top-1/4 h-[min(420px,50vh)] w-[min(420px,80vw)] rounded-full bg-primary/[0.09] blur-[100px]"
        initial={instant ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: instant ? 0.01 : 0.88, delay: instant ? 0 : 0.06 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-[15%] bottom-[20%] h-[min(380px,45vh)] w-[min(380px,75vw)] rounded-full bg-gold/[0.1] blur-[90px]"
        initial={instant ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: instant ? 0.01 : 0.88, delay: instant ? 0 : 0.12 }}
      />

      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl">
        <div className="mx-auto w-full max-w-md sm:max-w-lg space-y-8 text-center md:max-w-3xl md:text-left">
          <motion.div
            initial={instant ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: t.wordmark.dur,
              delay: t.wordmark.d,
              ease: easeOut,
            }}
          >
            <p className="font-display text-2xl font-semibold text-primary sm:text-3xl">BibleByte</p>
          </motion.div>

          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85"
            initial={instant ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: t.eyebrow.dur,
              delay: t.eyebrow.d,
              ease: easeOut,
            }}
          >
            Daily spiritual companion
          </motion.p>

          <motion.h1
            className="font-display text-fluid-hero font-semibold text-foreground"
            initial={instant ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: t.headline.dur,
              delay: t.headline.d,
              ease: easeOut,
            }}
          >
            Peaceful guidance for scripture, prayer, and life—every day.
          </motion.h1>

          <motion.p
            className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0 lg:max-w-3xl"
            initial={instant ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: t.body.dur,
              delay: t.body.d,
              ease: easeOut,
            }}
          >
            BibleByte helps you grow closer to God through calm rhythms of reading,
            reflection, and compassionate wisdom—beautifully minimal, deeply personal.
          </motion.p>
        </div>

        <motion.div
          className="mx-auto mt-10 w-full max-w-md sm:max-w-lg md:mt-12"
          initial={instant ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: t.card.dur,
            delay: t.card.d,
            ease: easeOut,
          }}
        >
          <SignInCard nextPath={nextPath} selfAnimateOAuth={false} />
        </motion.div>

        <motion.p
          className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground/90"
          initial={instant ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: t.trust.dur,
            delay: t.trust.d,
            ease: easeOut,
          }}
        >
          Scripture-grounded responses · Theology-aware AI boundaries · Built with care for trust.
        </motion.p>
      </div>
    </div>
  );
}
