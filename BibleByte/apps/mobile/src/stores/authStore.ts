import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase/client";

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

type AuthStore = {
  status: AuthStatus;
  isHydrated: boolean;
  errorMessage: string | null;
  user: User | null;
  session: Session | null;
  hydrate: () => Promise<void>;
  applySession: (session: Session | null) => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  status: "idle",
  isHydrated: false,
  errorMessage: null,
  user: null,
  session: null,
  hydrate: async () => {
    set({ status: "loading", errorMessage: null });
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      set({
        status: "anonymous",
        isHydrated: true,
        errorMessage: error.message,
        user: null,
        session: null
      });
      return;
    }

    const session = data.session;
    set({
      status: session ? "authenticated" : "anonymous",
      isHydrated: true,
      errorMessage: null,
      user: session?.user ?? null,
      session
    });
  },
  applySession: (session) =>
    set({
      status: session ? "authenticated" : "anonymous",
      isHydrated: true,
      errorMessage: null,
      user: session?.user ?? null,
      session
    }),
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    set({
      status: "anonymous",
      isHydrated: true,
      errorMessage: null,
      user: null,
      session: null
    });
  }
}));
