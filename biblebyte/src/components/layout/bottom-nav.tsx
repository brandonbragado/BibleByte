"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  PenLine,
  Settings,
  User,
} from "lucide-react";

import {
  appShellGutterClass,
  appShellMaxWidthClass,
} from "@/lib/ui/app-shell";
import { cn } from "@/lib/utils";

const links = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/bible", label: "Bible", Icon: BookOpen },
  { href: "/journal", label: "Journal", Icon: PenLine },
  { href: "/profile", label: "Profile", Icon: User },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pt-2 supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))]",
        appShellGutterClass
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "flex w-full items-center justify-between gap-0.5 rounded-2xl border border-border/70 bg-card/95 px-1.5 py-2 shadow-soft backdrop-blur-xl sm:gap-1 sm:px-2.5 md:gap-1.5 md:py-2.5 lg:px-3",
          appShellMaxWidthClass
        )}
      >
        {links.map(({ href, label, Icon }) => {
          const active =
            pathname === href || (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-2 md:text-[11px]",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5 shrink-0 md:size-6" strokeWidth={active ? 2.25 : 1.75} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
