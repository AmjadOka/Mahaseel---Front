"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";
import Alert from "@/components/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import { useMe } from "@/features/auth/useMe";
import dict from "./merchant.i18n";

const TABS = [
  { href: "/merchant/orders", key: "orders" },
  { href: "/merchant/products", key: "products" },
  { href: "/merchant/farms", key: "farms" },
  { href: "/merchant/wallet", key: "wallet" },
  { href: "/merchant/bank-accounts", key: "bank" },
] as const;

/** Signed-in merchants only; everyone else gets a pointer to the account page. */
export default function MerchantShell({ children }: { children: ReactNode }) {
  const t = useT(dict);
  const ready = useRequireAuth();
  const { user, loading, failed } = useMe();
  const pathname = usePathname();

  if (!ready || loading) return <div className="wrap py-10"><div className="h-12 animate-pulse rounded-full bg-line/60 motion-reduce:animate-none" aria-hidden="true" /></div>;
  if (failed) return <div className="wrap py-10"><Alert tone="error">{t("loadFailed")}</Alert></div>;
  if (user?.role !== "MERCHANT") {
    return (
      <div className="wrap py-14">
        <EmptyState icon={Store} title={t("merchantsOnly")} hint={t("merchantsOnlyHint")} action={<Link href="/account" className="btn btn-solid">{t("toAccount")}</Link>} />
      </div>
    );
  }

  return (
    <div className="wrap py-8 lg:py-12">
      <nav aria-label={t("navLabel")} className="-mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm transition-colors ${active ? "border-grove font-medium text-grove" : "border-transparent text-muted hover:text-ink"}`}
            >
              {t(tab.key)}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
