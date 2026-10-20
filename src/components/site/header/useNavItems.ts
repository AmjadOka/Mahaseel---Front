"use client";

import { useT } from "@/lib/i18n/LocaleProvider";
import { useMe } from "@/features/auth/useMe";
import { useSignedIn } from "@/features/auth/useSignedIn";
import dict from "./auth-actions.i18n";

type NavItem = { href: string; label: string };

/** Visitors get the marketing links. Signed-in users get links for their role instead. */
export function useNavItems(publicLinks: NavItem[]): NavItem[] {
  const t = useT(dict);
  const signedIn = useSignedIn();
  const { user } = useMe();

  if (!signedIn) return publicLinks;

  const market = publicLinks.find((l) => l.href === "/market");
  const role = user?.role;
  const items: Array<NavItem | undefined> =
    role === "ADMIN"
      ? [
          { href: "/admin", label: t("admin") },
          market,
          { href: "/ratings", label: t("ratings") },
        ]
      : role === "MERCHANT"
      ? [
          market,
          { href: "/merchant/orders", label: t("merchant") },
          { href: "/ratings", label: t("ratings") },
        ]
      : [
          market,
          { href: "/orders", label: t("myOrders") },
          { href: "/bids", label: t("myBids") },
        ];

  return items.filter((i): i is NavItem => !!i);
}
