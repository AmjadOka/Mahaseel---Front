import { create } from "zustand";
import { persist } from "zustand/middleware";

export const AUTH_STORAGE_KEY = "mahaseel-auth";

/** Backend enums may be lowercase; the whole UI compares against uppercase roles, so normalise once at every entry point. */
export const normalizeUser = <T extends { role?: string }>(u: T): T => {
  if (!u || !u.role) return u;
  return { ...u, role: String(u.role).toUpperCase() };
};

export type Role = "BUYER" | "MERCHANT" | "ADMIN";
export type Tokens = { accessToken: string; refreshToken: string };
export type AuthUser = {
  id: string;
  role: Role;
  email?: string;
  fullName?: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setTokens: (t: Tokens) => void;
  setUser: (u: AuthUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      setUser: (user) => set({ user: user ? normalizeUser(user) : user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: ({ accessToken, refreshToken, user }) => ({
        accessToken,
        refreshToken,
        user,
      }),
      // Rehydration from localStorage runs synchronously inside create(), before useAuthStore is assigned.
      // Defer the flag to a microtask so the store exists by the time it's set.
      onRehydrateStorage: () => () => {
        queueMicrotask(() => useAuthStore.setState({ hydrated: true }));
      },
      // Sessions saved before normalizeUser existed may still hold a lowercase role.
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthState> | undefined;
        return {
          ...current,
          ...p,
          user: p?.user ? normalizeUser(p.user) : null,
        };
      },
    }
  )
);
