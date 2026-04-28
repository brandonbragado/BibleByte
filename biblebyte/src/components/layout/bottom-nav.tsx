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
    <nav
      aria-label="Primary"
      className="fixed bottom-4 left-1/2 z-50 flex w-[min(100%-2rem,36rem)] -translate-x-1/2 items-center justify-between gap-1 rounded-2xl border border-border/70 bg-card/95 px-2 py-2 shadow-soft backdrop-blur-xl supports-[padding:max(0px)]:bottom-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {links.map(({ href, label, Icon }) => {
        const active =
          pathname === href || (href !== "/home" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
