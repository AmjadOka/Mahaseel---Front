"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { fetchMe } from "./auth-api";

/**
 * The signed-in user. Loaded whenever a token exists. Refetched when the cache is more than 5 minutes
 * old and when the window regains focus, so a role change (a merchant approval, for example) reaches
 * the header without a reload. Call useRefreshMe() right after an action that changes the role.
 */
export function useMe() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const q = useQuery({
    queryKey: ["me"],
    enabled: hydrated && !!token,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const me = await fetchMe();
      useAuthStore.getState().setUser(me);
      return me;
    },
  });
  return {
    user,
    loading: !user && (!hydrated || (!!token && !q.isError)),
    failed: !user && q.isError,
  };
}

/** Refetches the signed-in user now. Use it after an action that changes the role. */
export function useRefreshMe() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["me"] });
}
