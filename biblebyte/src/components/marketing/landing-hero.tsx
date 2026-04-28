"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <>
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <span className="font-display text-2xl font-semibold tracking-tight text-primary">
          BibleByte
        </span>
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 pb-28 pt-12 md:px-12 md:pb-36">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 text-center md:text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85">
            Daily spiritual companion
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-[3.35rem]">
            Peaceful guidance for scripture, prayer, and life—every day.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground md:mx-0">
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

      <footer className="relative z-10 px-6 py-8 text-center text-xs text-muted-foreground md:px-12">
        Scripture-grounded responses · Theology-aware AI boundaries · Built with care for trust.
      </footer>
    </>
  );
}
