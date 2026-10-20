"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  exchangeGoogleCode,
  fetchMe,
  homeFor,
  navigateAfterAuth,
  safeNext,
} from "@/features/auth/auth-api";
import { GOOGLE_NEXT_KEY } from "@/features/auth/GoogleButton";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Landing page after Google sign-in. The backend sends a one-time code here, never a token. The code
 * is exchanged once, then removed from the address bar so it stays out of history.
 */
export default function GoogleSuccessPage() {
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Strict Mode runs effects twice in development. The code is single-use, so run once.
    if (started.current) return;
    started.current = true;

    const code = new URLSearchParams(window.location.search).get("code");
    window.history.replaceState(null, "", window.location.pathname);
    // The destination saved before the redirect. safeNext rejects anything that isn't a same-site path.
    const next = safeNext(sessionStorage.getItem(GOOGLE_NEXT_KEY));
    sessionStorage.removeItem(GOOGLE_NEXT_KEY);

    // Resolves true on success, false when no code was present. Errors are thrown.
    const run = async (): Promise<boolean> => {
      if (!code) return false;

      const tokens = await exchangeGoogleCode(code);
      useAuthStore.getState().setTokens(tokens);
      const me = await fetchMe();
      useAuthStore.getState().setUser(me);
      await navigateAfterAuth(next ?? homeFor(me.role));
      return true;
    };

    // State updates happen in promise callbacks, not in the effect body.
    run()
      .then((ok) => {
        if (!ok) setFailed(true);
      })
      .catch(() => {
        useAuthStore.getState().clear();
        setFailed(true);
      });
  }, []);

  if (failed) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <p className="mb-2">تعذّر إكمال تسجيل الدخول بحساب Google.</p>
        <p className="mb-4">Google sign-in could not be completed.</p>
        <Link href="/login" className="underline">
          /login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <p>جارٍ تسجيل الدخول… · Signing you in…</p>
    </main>
  );
}
