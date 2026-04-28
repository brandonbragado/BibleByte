import { createClient } from "@supabase/supabase-js";

/** Server-side anon client (no cookies). Use when RLS allows `anon` — e.g. public daily verse placeholders for snippet/widget payloads. */
export function createPublicAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return createClient(url, anon);
}
