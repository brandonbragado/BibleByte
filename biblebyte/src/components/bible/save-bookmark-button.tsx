"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Bookmark } from "lucide-react";

import { toggleSavedChapter } from "@/app/(main)/bible/actions";
import { Button } from "@/components/ui/button";

type Props = {
  bookCode: string;
  chapter: number;
  initialSaved: boolean;
};

export function SaveBookmarkButton({ bookCode, chapter, initialSaved }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function click() {
    startTransition(async () => {
      await toggleSavedChapter(bookCode, chapter);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={initialSaved ? "default" : "outline"}
      size="sm"
      className="gap-2"
      disabled={pending}
      onClick={click}
      aria-pressed={initialSaved}
    >
      <Bookmark className="size-4" strokeWidth={1.75} />
      {pending ? "Saving…" : initialSaved ? "Saved" : "Save chapter"}
    </Button>
  );
}
