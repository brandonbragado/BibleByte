import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookByCode } from "@/lib/bible/canon";

type Props = { params: Promise<{ book: string }> };

export default async function BibleBookPage({ params }: Props) {
  const { book: raw } = await params;
  const book = getBookByCode(raw);

  if (!book) {
    notFound();
  }

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-10 pt-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1">
          <Link href="/bible">
            <ArrowLeft className="size-4" />
            Books
          </Link>
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
          {book.testament === "OT" ? "Old Testament" : "New Testament"}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{book.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Select a chapter. Verse bodies are placeholders until scripture licensing is configured.
        </p>
      </header>

      <Card className="border-primary/12 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl">Chapters</CardTitle>
          <CardDescription>{book.chapters} chapters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {chapters.map((n) => (
              <Link
                key={n}
                href={`/bible/${book.code}/${n}`}
                className="flex h-11 items-center justify-center rounded-xl border border-border/80 bg-background/70 text-sm font-semibold transition-colors hover:border-primary/50 hover:bg-accent/70"
              >
                {n}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
