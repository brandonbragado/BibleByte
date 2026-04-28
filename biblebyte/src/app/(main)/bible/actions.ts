"use server";

import { revalidatePath } from "next/cache";

import { instrumentAnalyticsEvent } from "@/lib/analytics/server";
import { getBookByCode } from "@/lib/bible/canon";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedChapter(bookCode: string, chapter: number): Promise<void> {
  const book = getBookByCode(bookCode);
  if (!book || chapter < 1 || chapter > book.chapters) {
    throw new Error("Invalid passage.");
  }

  const reference = `${book.name} ${chapter}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sign in to save passages.");
  }

  const { data: existing } = await supabase
    .from("saved_verses")
    .select("id")
    .eq("user_id", user.id)
    .eq("reference", reference)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("saved_verses").delete().eq("id", existing.id);

    if (error) {
      console.error(error);
      throw new Error("Could not remove bookmark.");
    }

  } else {
    const { error } = await supabase.from("saved_verses").insert({
      user_id: user.id,
      reference,
    });

    if (error) {
      console.error(error);
      throw new Error(
        error.code === "23505"
          ? "Already saved."
          : error.code === "42P01"
            ? "Run migrations through 001 (saved_verses)."
            : "Could not save passage."
      );
    }

    await instrumentAnalyticsEvent("verse_saved", { reference });
  }

  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath(`/bible/${bookCode}/${chapter}`);
}
