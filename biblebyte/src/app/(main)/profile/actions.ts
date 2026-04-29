"use server";

import { revalidatePath } from "next/cache";

import { enforceRateLimitServerAction } from "@/lib/rate-limit/server-action";
import { createClient } from "@/lib/supabase/server";

const MAX_NAME = 80;
const MAX_PHONE = 32;

function sanitizeName(raw: unknown): string {
  const s = String(raw ?? "").trim().replace(/[\u0000-\u001F\u007F]/g, "");
  return s.slice(0, MAX_NAME);
}

function sanitizePhone(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const cleaned = s.replace(/[^\d+\-().\s]/g, "").slice(0, MAX_PHONE);
  return cleaned.length ? cleaned : null;
}

function isValidEmail(s: string): boolean {
  if (s.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export type UpdateProfileIdentityResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileIdentity(
  _prev: UpdateProfileIdentityResult | null,
  formData: FormData
): Promise<UpdateProfileIdentityResult> {
  await enforceRateLimitServerAction("profile_identity");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to update your profile." };
  }

  const firstName = sanitizeName(formData.get("first_name"));
  const lastName = sanitizeName(formData.get("last_name"));
  const phone = sanitizePhone(formData.get("phone"));
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!firstName) {
    return { ok: false, error: "First name is required." };
  }

  if (!emailRaw || !isValidEmail(emailRaw)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      first_name: firstName,
      last_name: lastName || null,
      phone,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error(profileError);
    if (profileError.message?.includes("first_name") || profileError.code === "42703") {
      return {
        ok: false,
        error: "Database missing profile columns — run supabase/migrations/007_profile_identity.sql.",
      };
    }
    return { ok: false, error: "Could not save profile." };
  }

  const currentEmail = user.email?.toLowerCase() ?? "";
  if (emailRaw !== currentEmail) {
    const { error: authError } = await supabase.auth.updateUser({ email: emailRaw });
    if (authError) {
      console.error(authError);
      return {
        ok: false,
        error:
          authError.message ||
          "Could not update email. You may need to confirm the new address (check Supabase Auth settings).",
      };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/settings");
  return { ok: true };
}
