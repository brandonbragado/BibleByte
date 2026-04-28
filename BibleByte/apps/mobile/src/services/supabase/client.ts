import { createClient } from "@supabase/supabase-js";
import { env } from "../../constants/env";
import type { Database } from "../../types/supabase";
import { secureStorage } from "./secureStorage";

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE is required for mobile OAuth (in-app browser + code exchange); implicit hash tokens are handled as fallback.
    flowType: "pkce"
  }
});
