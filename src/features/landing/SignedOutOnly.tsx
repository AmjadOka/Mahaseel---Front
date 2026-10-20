"use client";

import type { ReactNode } from "react";
import { useSignedIn } from "@/features/auth/useSignedIn";

/** Renders its children only for visitors who are not signed in. */
export default function SignedOutOnly({ children }: { children: ReactNode }) {
  return useSignedIn() ? null : <>{children}</>;
}
