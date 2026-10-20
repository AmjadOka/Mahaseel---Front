"use client";

import { useAuthStore } from "@/stores/auth-store";

/** True only after the persisted session has loaded and a token exists. */
export function useSignedIn(): boolean {
  return useAuthStore((s) => s.hydrated && !!s.accessToken);
}
