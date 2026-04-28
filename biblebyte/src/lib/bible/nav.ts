import { BIBLE_BOOKS, type BibleBookMeta, getBookByCode } from "@/lib/bible/canon";

function indexOfBook(code: string): number {
  const u = code.toUpperCase();
  return BIBLE_BOOKS.findIndex((b) => b.code === u);
}

/** Previous passage in canonical order (cross-book); null if already at Genesis 1. */
export function previousChapter(bookCode: string, chapter: number): {
  book: BibleBookMeta;
  chapter: number;
} | null {
  const book = getBookByCode(bookCode);
  if (!book) {
    return null;
  }
  if (chapter > 1) {
    return { book, chapter: chapter - 1 };
  }
  const idx = indexOfBook(book.code);
  if (idx <= 0) {
    return null;
  }
  const prevBook = BIBLE_BOOKS[idx - 1];
  return { book: prevBook, chapter: prevBook.chapters };
}

/** Next passage in canonical order (cross-book); null if already at Revelation last chapter. */
export function nextChapter(bookCode: string, chapter: number): {
  book: BibleBookMeta;
  chapter: number;
} | null {
  const book = getBookByCode(bookCode);
  if (!book) {
    return null;
  }
  if (chapter < book.chapters) {
    return { book, chapter: chapter + 1 };
  }
  const idx = indexOfBook(book.code);
  if (idx < 0 || idx >= BIBLE_BOOKS.length - 1) {
    return null;
  }
  const nextBook = BIBLE_BOOKS[idx + 1];
  return { book: nextBook, chapter: 1 };
}
