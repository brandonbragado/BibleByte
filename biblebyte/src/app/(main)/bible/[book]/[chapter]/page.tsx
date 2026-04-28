import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { BibleChapterReaderClient } from "@/components/bible/bible-chapter-reader-client";
import { ReaderMountEffect } from "@/components/bible/reader-mount-effect";
import { SaveBookmarkButton } from "@/components/bible/save-bookmark-button";
import { Button } from "@/components/ui/button";
import { getScriptureProviderMode } from "@/config/scripture";
import { getBookByCode } from "@/lib/bible/canon";
import { nextChapter, previousChapter } from "@/lib/bible/nav";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ book: string; chapter: string }> };

export default async function BibleChapterReaderPage({ params }: Props) {
  const { book: rawBook, chapter: rawChapter } = await params;
  const book = getBookByCode(rawBook);
  const chapter = Number.parseInt(rawChapter, 10);

  if (!book || Number.isNaN(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  const prevPassage = previousChapter(book.code, chapter);
  const nextPassage = nextChapter(book.code, chapter);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let chapterSaved = false;
  if (user) {
    const reference = `${book.name} ${chapter}`;
    const { data: sv } = await supabase
      .from("saved_verses")
      .select("id")
      .eq("user_id", user.id)
      .eq("reference", reference)
      .maybeSingle();
    chapterSaved = Boolean(sv?.id);
  }

  const mode = getScriptureProviderMode();

  return (
    <div className="space-y-6 pb-28 pt-4">
      <ReaderMountEffect bookCode={book.code} chapter={chapter} verse={1} />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bible/${book.code}`}>Chapters</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bible">All books</Link>
        </Button>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
          {book.name}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Chapter {chapter}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "api_bible"
            ? "Chapter text loads from your BibleByte API (server-side API.Bible) — attribution appears with each chapter."
            : "Chapter text loads from your BibleByte API — attribution appears with each chapter."}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {user ? (
            <SaveBookmarkButton
              bookCode={book.code}
              chapter={chapter}
              initialSaved={chapterSaved}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Sign in to bookmark this chapter.</p>
          )}
        </div>
      </header>

      <BibleChapterReaderClient
        bookCode={book.code}
        bookName={book.name}
        chapter={chapter}
        headerExtra={
          <p className="text-xs text-muted-foreground">
            Typography is tuned for calm reading; distraction-free mode can follow in a later pass.
          </p>
        }
        footerNav={
          <div className="flex items-center justify-between gap-4">
            {prevPassage ? (
              <Button variant="outline" asChild className="max-w-[min(100%,15rem)] gap-1">
                <Link href={`/bible/${prevPassage.book.code}/${prevPassage.chapter}`}>
                  <ChevronLeft className="size-4 shrink-0" />
                  <span className="truncate text-left">
                    {prevPassage.book.name} {prevPassage.chapter}
                  </span>
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {nextPassage ? (
              <Button variant="outline" asChild className="max-w-[min(100%,15rem)] gap-1">
                <Link href={`/bible/${nextPassage.book.code}/${nextPassage.chapter}`}>
                  <span className="truncate text-right">
                    {nextPassage.book.name} {nextPassage.chapter}
                  </span>
                  <ChevronRight className="size-4 shrink-0" />
                </Link>
              </Button>
            ) : (
              <span />
            )}
          </div>
        }
      />
    </div>
  );
}
