"use client";

import Link from "next/link";
import NotificationBell from "@/features/notifications/NotificationBell";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useAuthStore } from "@/stores/auth-store";
import AccountMenu from "./AccountMenu";
import dict from "./auth-actions.i18n";

/** Login / sign-up for visitors; notification bell + account menu once signed in. */
export default function AuthActions() {
  const t = useT(dict);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  if (!hydrated) return null;
  if (!token) {
    return (
      <>
        <Link href="/login" className="btn btn-line ms-2 hidden h-9 px-4 md:inline-flex">
          {t("login")}
        </Link>
        <Link href="/signup" className="btn btn-solid hidden h-9 px-4 md:inline-flex">
          {t("signup")}
        </Link>
      </>
    );
  }
  return (
    <>
      <NotificationBell />
      <AccountMenu />
    </>
  );
}
