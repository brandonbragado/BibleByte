import type { PropsWithChildren } from "react";
import { useAuthStore } from "../../stores/authStore";

export function AuthGate({ children }: PropsWithChildren) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  if (!isHydrated) {
    return null;
  }
  return <>{children}</>;
}
