import { supabase } from "./supabase/client";
import { getAuthenticatedUser } from "./supabase/auth";

export type SavedVerse = {
  id: string;
  verseId: string | null;
  verseReference: string;
  verseText: string;
};

type SavedVerseQueryRow = {
  id: string;
  verse_id: string | null;
  bible_verses: Array<{
    id: string | null;
    verse_number: number | null;
    verse_text: string | null;
    bible_chapters: Array<{
      chapter_number: number | null;
      bible_books: Array<{
        name: string | null;
      }>;
    }>;
  }>;
};

export async function fetchSavedVerses(): Promise<SavedVerse[]> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("saved_verses")
    .select("id, verse_id, bible_verses(id, verse_number, verse_text, bible_chapters(chapter_number, bible_books(name)))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as SavedVerseQueryRow[]).map((row) => {
    const verse = row.bible_verses?.[0];
    const chapter = verse?.bible_chapters?.[0];
    const book = chapter?.bible_books?.[0];

    return {
      id: row.id,
      verseId: row.verse_id ?? verse?.id ?? null,
      verseReference: `${book?.name ?? "Unknown"} ${chapter?.chapter_number ?? "?"}:${verse?.verse_number ?? "?"}`,
      verseText: verse?.verse_text ?? "NIV placeholder text unavailable."
    };
  });
}
