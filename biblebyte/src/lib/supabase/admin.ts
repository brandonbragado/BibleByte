import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — server-only. Never import from Client Components.
 * Required for auth.admin.deleteUser and other privileged ops (critical action item #4).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !serviceRoleKey?.trim()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured — privileged operations are disabled."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
