"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <>
      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-6 sm:py-6 md:px-10 lg:px-14">
        <span className="font-display text-xl font-semibold tracking-tight text-primary sm:text-2xl">
          BibleByte
        </span>
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-24 pt-8 sm:px-6 sm:pb-28 sm:pt-12 md:px-10 md:pb-32 lg:max-w-5xl lg:px-14 lg:pb-36 xl:max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 text-center md:text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85">
            Daily spiritual companion
          </p>
          <h1 className="font-display text-fluid-hero font-semibold text-foreground">
            Peaceful guidance for scripture, prayer, and life—every day.
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0 lg:max-w-3xl">
            BibleByte helps you grow closer to God through calm rhythms of reading,
            reflection, and compassionate wisdom—beautifully minimal, deeply personal.
          </p>
          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row md:justify-start">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full shadow-soft">
                Begin your journey
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full border-primary/20 sm:w-auto" asChild>
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 px-4 py-8 text-center text-xs text-muted-foreground sm:px-8 md:px-12 lg:px-16">
        Scripture-grounded responses · Theology-aware AI boundaries · Built with care for trust.
      </footer>
    </>
  );
}
