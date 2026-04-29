"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import {
  MAIN_SHELL_ENTRANCE_DURATION_S,
  MAIN_SHELL_ENTRANCE_EASE,
  MAIN_SHELL_ENTRANCE_Y_PX,
} from "@/lib/ui/main-shell-motion";

type Props = {
  /** From OAuth or /login redirect — slow fade; URL is cleaned after animation. */
  playSlowEntrance: boolean;
  children: ReactNode;
};

export function HomePageEntrance({ playSlowEntrance, children }: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const active = Boolean(playSlowEntrance && !reduceMotion);

  useEffect(() => {
    if (!playSlowEntrance) return;
    const t = window.setTimeout(() => {
      router.replace("/home", { scroll: false });
    }, MAIN_SHELL_ENTRANCE_DURATION_S * 1000 + 250);
    return () => window.clearTimeout(t);
  }, [playSlowEntrance, router]);

  return (
    <motion.div
      className="space-y-10 pb-8 pt-4"
      initial={active ? { opacity: 0, y: MAIN_SHELL_ENTRANCE_Y_PX } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        active
          ? {
              duration: MAIN_SHELL_ENTRANCE_DURATION_S,
              ease: MAIN_SHELL_ENTRANCE_EASE,
            }
          : { duration: 0.01 }
      }
    >
      {children}
    </motion.div>
  );
}
