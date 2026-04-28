import type { User } from "@supabase/supabase-js";
import { supabase } from "./client";

export async function getAuthenticatedUser(): Promise<User | null> {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
