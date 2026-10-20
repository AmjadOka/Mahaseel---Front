// src/features/landing/RedirectIfSignedIn.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useMe } from "@/features/auth/useMe";
import { homeFor } from "@/features/auth/auth-api";

export default function RedirectIfSignedIn() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const { user } = useMe();
  useEffect(() => {
    if (hydrated && token && user) router.replace(homeFor(user.role));
  }, [hydrated, token, user, router]);

  return null;
}
