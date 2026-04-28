"use server";

import { revalidatePath } from "next/cache";

import { instrumentAnalyticsEvent } from "@/lib/analytics/server";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntryKind, PrayerStatus } from "@/types/journal";

export async function createPrayer(formData: FormData): Promise<void> {
  const request = String(formData.get("request") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  if (!request || request.length > 8000) {
    throw new Error("Prayer request is required (max 8000 characters).");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in.");
  }

  const { error } = await supabase.from("prayers").insert({
    user_id: user.id,
    request,
    notes: notesRaw || null,
    status: "asked",
  });

  if (error) {
    console.error(error);
    throw new Error(
      error.code === "42P01"
        ? "Run migration 004 in Supabase for prayers."
        : "Could not save prayer."
    );
  }

  await instrumentAnalyticsEvent("prayer_created", {});
  revalidatePath("/journal");
}

export async function updatePrayerStatus(prayerId: string, status: PrayerStatus): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in.");
  }

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "answered") {
    updates.answered_at = new Date().toISOString();
  } else {
    updates.answered_at = null;
  }

  const { error } = await supabase
    .from("prayers")
    .update(updates)
    .eq("id", prayerId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    throw new Error("Could not update prayer.");
  }

  if (status === "answered") {
    await instrumentAnalyticsEvent("prayer_marked_answered", { prayer_id: prayerId });
  }

  revalidatePath("/journal");
}

export async function deletePrayer(prayerId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in.");
  }

  const { error } = await supabase
    .from("prayers")
    .delete()
    .eq("id", prayerId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    throw new Error("Could not delete prayer.");
  }

  revalidatePath("/journal");
}

export async function createJournalEntry(formData: FormData): Promise<void> {
  const kind = String(formData.get("kind") ?? "") as JournalEntryKind;
  const body = String(formData.get("body") ?? "").trim();

  const allowed: JournalEntryKind[] = ["reflection", "gratitude", "insight"];
  if (!allowed.includes(kind)) {
    throw new Error("Invalid entry type.");
  }
  if (!body || body.length > 12000) {
    throw new Error("Entry text is required (max 12000 characters).");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in.");
  }

  const { error } = await supabase.from("journal_entries").insert({
    user_id: user.id,
    kind,
    body,
  });

  if (error) {
    console.error(error);
    throw new Error(
      error.code === "42P01"
        ? "Run migration 004 in Supabase for journal_entries."
        : "Could not save entry."
    );
  }

  await instrumentAnalyticsEvent("journal_entry_created", { kind });
  revalidatePath("/journal");
}
