"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  MAIN_SHELL_ENTRANCE_DURATION_S,
  MAIN_SHELL_ENTRANCE_EASE,
  MAIN_SHELL_ENTRANCE_Y_PX,
  mainTabKeyFromPathname,
} from "@/lib/ui/main-shell-motion";

type Props = { children: ReactNode };

export function MainTabContentTransition({ children }: Props) {
  const pathname = usePathname();
  const tabKey = mainTabKeyFromPathname(pathname);
  const reduceMotion = useReducedMotion();
  const [settledTabKey, setSettledTabKey] = useState(tabKey);

  useEffect(() => {
    if (settledTabKey === tabKey) return;
    const t = window.setTimeout(
      () => setSettledTabKey(tabKey),
      MAIN_SHELL_ENTRANCE_DURATION_S * 1000
    );
    return () => window.clearTimeout(t);
  }, [tabKey, settledTabKey]);

  const playEnter =
    Boolean(
      !reduceMotion &&
        settledTabKey !== tabKey
    );

  return (
    <motion.div
      key={tabKey}
      className="w-full"
      initial={playEnter ? { opacity: 0, y: MAIN_SHELL_ENTRANCE_Y_PX } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        playEnter
          ? { duration: MAIN_SHELL_ENTRANCE_DURATION_S, ease: MAIN_SHELL_ENTRANCE_EASE }
          : { duration: 0.01 }
      }
    >
      {children}
    </motion.div>
  );
}
