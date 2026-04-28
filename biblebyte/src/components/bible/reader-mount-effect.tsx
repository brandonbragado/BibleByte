"use client";

import { useEffect } from "react";

import { saveReadingPosition } from "@/app/(main)/reading-actions";

type Props = {
  bookCode: string;
  chapter: number;
  verse?: number;
};

/** Persists last-opened passage when the reader mounts or the reference changes. */
export function ReaderMountEffect({ bookCode, chapter, verse = 1 }: Props) {
  useEffect(() => {
    void saveReadingPosition(bookCode, chapter, verse);
  }, [bookCode, chapter, verse]);

  return null;
}
