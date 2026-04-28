"use server";

import { revalidatePath } from "next/cache";

import { getBookByCode } from "@/lib/bible/canon";
import { createClient } from "@/lib/supabase/server";

export type SaveReadingResult = { ok: true } | { ok: false; error: string };

export async function saveReadingPosition(
  bookCode: string,
  chapter: number,
  verse: number = 1
): Promise<SaveReadingResult> {
  const book = getBookByCode(bookCode);
  if (!book) {
    return { ok: false, error: "Unknown book." };
  }
  if (chapter < 1 || chapter > book.chapters) {
    return { ok: false, error: "Invalid chapter." };
  }
  if (verse < 1) {
    return { ok: false, error: "Invalid verse." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("reading_positions").upsert(
    {
      user_id: user.id,
      book_code: book.code,
      chapter,
      verse,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error(error);
    return {
      ok: false,
      error:
        error.message.includes("reading_positions") || error.code === "42P01"
          ? "Run supabase/migrations/003_tier1_reading_and_companion.sql in Supabase."
          : "Could not save reading position.",
    };
  }

  revalidatePath("/home");
  revalidatePath("/bible");
  return { ok: true };
}
