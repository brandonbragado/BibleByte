import {
  getPassage,
  listBooks,
  listChaptersForBook,
  listBibles,
  searchBible,
} from "@/lib/scripture/api-bible-provider";
import type { Bible, Book, Chapter, Passage, SearchResponseData } from "@/lib/scripture/types";

/**
 * Upstream catalog + search abstraction — implement once per provider so BibleByte
 * can swap API.Bible for another licensed feed without changing API routes.
 */
export interface ScriptureCatalogProvider {
  getBibles(): Promise<Bible[]>;
  getBooks(bibleId: string): Promise<Book[]>;
  getChapters(bibleId: string, bookId: string): Promise<Chapter[]>;
  getPassage(bibleId: string, passageId: string): Promise<Passage>;
  searchScripture(bibleId: string, query: string, limit?: number): Promise<SearchResponseData>;
}

export function createApiBibleCatalogProvider(): ScriptureCatalogProvider {
  return {
    getBibles: () => listBibles(),
    getBooks: (bibleId) => listBooks(bibleId),
    getChapters: (bibleId, bookId) => listChaptersForBook(bibleId, bookId),
    getPassage: (bibleId, passageId) => getPassage(bibleId, passageId),
    searchScripture: (bibleId, query, limit = 20) =>
      searchBible(bibleId, query, String(limit)),
  };
}
