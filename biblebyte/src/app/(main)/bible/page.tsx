import Link from "next/link";

import { BookOpen } from "lucide-react";

import { BibleCatalogPanel } from "@/components/bible/bible-catalog-panel";
import { BibleSearchPanel } from "@/components/bible/bible-search-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { booksForTestament } from "@/lib/bible/canon";

export default function BibleIndexPage() {
  const ot = booksForTestament("OT");
  const nt = booksForTestament("NT");

  return (
    <div className="space-y-8 pb-10 pt-4">
      <header className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/12 p-3 text-primary">
          <BookOpen className="size-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
            Bible
          </p>
          <h1 className="font-display text-fluid-page-title font-semibold">
            Choose a book
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pick a book below or search your active Bible edition. Text is fetched through
            BibleByte API routes (never API.Bible from the browser). Your last passage syncs
            to Continue reading on Home.
          </p>
        </div>
      </header>

      <BibleCatalogPanel />

      <BibleSearchPanel />

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Old Testament</CardTitle>
          <CardDescription>Hebrew Scriptures</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            {ot.map((b) => (
              <li key={b.code}>
                <Link
                  href={`/bible/${b.code}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/50"
                >
                  <span>{b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.chapters} ch.</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">New Testament</CardTitle>
          <CardDescription>Apostolic writings</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            {nt.map((b) => (
              <li key={b.code}>
                <Link
                  href={`/bible/${b.code}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/50"
                >
                  <span>{b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.chapters} ch.</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
