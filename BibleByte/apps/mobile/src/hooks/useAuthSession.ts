import { useEffect } from "react";
import { supabase } from "../services/supabase/client";
import { useAuthStore } from "../stores/authStore";

export function useAuthSession() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const applySession = useAuthStore((state) => state.applySession);

  useEffect(() => {
    void hydrate();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => data.subscription.unsubscribe();
  }, [applySession, hydrate]);
}
