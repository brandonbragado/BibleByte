import Link from "next/link";

import { BookOpen, ChevronDown } from "lucide-react";

import { BibleTranslationBar } from "@/components/bible/bible-translation-bar";
import { BibleSearchPanel } from "@/components/bible/bible-search-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { booksForTestament } from "@/lib/bible/canon";
import { cn } from "@/lib/utils";

function TestamentBookSection({
  title,
  subtitle,
  bookCount,
  books,
}: {
  title: string;
  subtitle: string;
  bookCount: number;
  books: ReturnType<typeof booksForTestament>;
}) {
  return (
    <details className="bb-disclosure border-b border-border/60 last:border-b-0">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition-colors",
          "hover:bg-muted/40 [&::-webkit-details-marker]:hidden"
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
          <span className="font-display text-base font-semibold text-foreground sm:text-lg">
            {title}
          </span>
          <span className="text-xs text-muted-foreground sm:text-sm">{subtitle}</span>
        </span>
        <span className="shrink-0 rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {bookCount} books
        </span>
        <ChevronDown
          className="bb-disclosure-chevron size-5 shrink-0 text-muted-foreground"
          strokeWidth={2}
          aria-hidden
        />
      </summary>
      <div className="border-t border-border/40 bg-muted/10 px-3 pb-4 pt-2">
        <ul className="grid max-h-[min(70vh,28rem)] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <li key={b.code}>
              <Link
                href={`/bible/${b.code}`}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <span>{b.name}</span>
                <span className="text-xs text-muted-foreground">{b.chapters} ch.</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

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
            Open a testament, choose a book, then a chapter—or search. Your place syncs to
            Continue reading on Home.
          </p>
        </div>
      </header>

      <BibleSearchPanel />

      <Card className="border-primary/12 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl">Books of the Bible</CardTitle>
          <CardDescription>
            Same 66 books as a printed Bible. Expand Old or New Testament, then tap a book for
            chapters.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <BibleTranslationBar />
          <TestamentBookSection
            title="Old Testament"
            subtitle="Hebrew Scriptures"
            bookCount={ot.length}
            books={ot}
          />
          <TestamentBookSection
            title="New Testament"
            subtitle="Apostolic writings"
            bookCount={nt.length}
            books={nt}
          />
        </CardContent>
      </Card>
    </div>
  );
}
