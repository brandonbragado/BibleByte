"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { enforceRateLimitServerAction } from "@/lib/rate-limit/server-action";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

function parseWallTime(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const h = Number.parseInt(match[1], 10);
  const m = Number.parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export async function updatePreferences(formData: FormData): Promise<void> {
  const analyticsOptIn = formData.get("analytics_opt_in") === "on";
  const reminderEnabled = formData.get("reminder_enabled") === "on";
  const reminderWallTime =
    reminderEnabled ? parseWallTime(String(formData.get("reminder_wall_time") ?? "")) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in.");
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      analytics_opt_in: analyticsOptIn,
      reminder_enabled: reminderEnabled,
      reminder_wall_time: reminderWallTime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error(error);
    throw new Error(
      error.message.includes("analytics_opt_in") || error.code === "42703"
        ? "Run supabase/migrations/005_tier3_personalization.sql."
        : "Could not save preferences."
    );
  }

  revalidatePath("/settings");
  revalidatePath("/home");
  revalidatePath("/profile");
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    throw new Error('Confirmation must match the word DELETE (uppercase).');
  }

  await enforceRateLimitServerAction("delete_account");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    throw new Error(
      "Account deletion is unavailable: set SUPABASE_SERVICE_ROLE_KEY server-side only."
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error(error);
    throw new Error("Could not delete account. Try again or contact support.");
  }

  await supabase.auth.signOut();
  redirect("/");
}
