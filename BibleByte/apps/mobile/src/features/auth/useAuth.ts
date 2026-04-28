import { useMemo } from "react";
import { useAuthStore } from "../../stores/authStore";
import { authApi } from "./api";

export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  return useMemo(
    () => ({
      status,
      isHydrated,
      isAuthenticated: status === "authenticated",
      user,
      signOut,
      signInWithGoogle: authApi.signInWithGoogle,
      signInWithApple: authApi.signInWithApple
    }),
    [isHydrated, signOut, status, user]
  );
}
