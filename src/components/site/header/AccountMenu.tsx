"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CreditCard, Gavel, LogOut, PackageCheck, ShieldCheck, Star, Store, UserRound, type LucideIcon } from "lucide-react";
import { useDismiss } from "@/components/popover/useDismiss";
import { useT } from "@/lib/i18n/LocaleProvider";
import { signOut } from "@/features/auth/auth-api";
import { useMe } from "@/features/auth/useMe";
import dict from "./auth-actions.i18n";

type Key = "admin" | "myOrders" | "myBids" | "myPayments" | "merchant" | "ratings" | "notifications" | "myAccount";

export default function AccountMenu() {
  const t = useT(dict);
  const { user } = useMe();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  const role = user?.role;
  const links: { href: string; key: Key; Icon: LucideIcon }[] = [
    ...(role === "ADMIN" ? [{ href: "/admin", key: "admin" as const, Icon: ShieldCheck }] : []),
    ...(role === "MERCHANT" ? [{ href: "/merchant/orders", key: "merchant" as const, Icon: Store }] : []),
    ...(!role || role === "BUYER"
      ? [
          { href: "/orders", key: "myOrders" as const, Icon: PackageCheck },
          { href: "/bids", key: "myBids" as const, Icon: Gavel },
          { href: "/payments", key: "myPayments" as const, Icon: CreditCard },
        ]
      : []),
    { href: "/notifications", key: "notifications", Icon: Bell },
    { href: "/ratings", key: "ratings", Icon: Star },
    { href: "/account", key: "myAccount", Icon: UserRound },
  ];

  const name = user?.fullName || user?.email || t("account");
  const item = "flex w-full items-center gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-grove-soft";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="account-panel" aria-label={name} className="grid size-9 place-items-center rounded-full bg-grove text-sm font-bold text-on-solid">
        {name.trim().charAt(0).toUpperCase()}
      </button>

      {open && (
        <div id="account-panel" className="absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-paper shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="line-clamp-1 font-medium">{name}</p>
            {user?.email && user.fullName && <p className="line-clamp-1 text-xs text-muted">{user.email}</p>}
          </div>
          {links.map(({ href, key, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={item}>
              <Icon className="size-4 text-muted" aria-hidden="true" />
              {t(key)}
            </Link>
          ))}
          <button type="button" onClick={() => void signOut()} className={`${item} border-t border-line`}>
            <LogOut className="size-4 text-muted rtl:-scale-x-100" aria-hidden="true" />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
