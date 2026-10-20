"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Landmark,
  LayoutDashboard,
  Megaphone,
  Package,
  ScrollText,
  ShieldCheck,
  Star,
  Tags,
  Tractor,
  Users,
  type LucideIcon,
} from "lucide-react";
import Alert from "@/components/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import { useMe } from "@/features/auth/useMe";
import dict from "./admin.i18n";

const NAV: { href: string; key: "navDashboard" | "navUsers" | "navFarms" | "navProducts" | "navOrders" | "navWithdrawals" | "navRatings" | "navCategories" | "navBroadcast" | "navReports" | "navAudit"; Icon: LucideIcon }[] = [
  { href: "/admin", key: "navDashboard", Icon: LayoutDashboard },
  { href: "/admin/users", key: "navUsers", Icon: Users },
  { href: "/admin/farms", key: "navFarms", Icon: Tractor },
  { href: "/admin/products", key: "navProducts", Icon: Package },
  { href: "/admin/orders", key: "navOrders", Icon: ClipboardList },
  { href: "/admin/withdrawals", key: "navWithdrawals", Icon: Landmark },
  { href: "/admin/ratings", key: "navRatings", Icon: Star },
  { href: "/admin/categories", key: "navCategories", Icon: Tags },
  { href: "/admin/broadcast", key: "navBroadcast", Icon: Megaphone },
  { href: "/admin/reports", key: "navReports", Icon: BarChart3 },
  { href: "/admin/audit", key: "navAudit", Icon: ScrollText },
];

/**
 * Admin accounts only. The admin secret never reaches the browser: the server proxy adds it to
 * every request. Access control is the admin role, checked by the backend, and the secret plus
 * the server's IP allowlist. The old step that asked for the secret in the browser is gone. It
 * was needed only while the browser held the secret, and it would now just ask for a value the
 * browser doesn't have.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const t = useT(dict);
  const ready = useRequireAuth();
  const { user, loading, failed } = useMe();
  const pathname = usePathname();

  if (!ready || loading)
    return (
      <div className="wrap py-10">
        <div className="h-12 animate-pulse rounded-full bg-line/60 motion-reduce:animate-none" aria-hidden="true" />
      </div>
    );
  if (failed)
    return (
      <div className="wrap py-10">
        <Alert tone="error">{t("loadFailed")}</Alert>
      </div>
    );
  if (user?.role !== "ADMIN")
    return (
      <div className="wrap py-14">
        <EmptyState icon={ShieldCheck} title={t("adminsOnly")} />
      </div>
    );

  return (
    <div className="wrap grid gap-8 py-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:py-12">
      <nav
        aria-label={t("navLabel")}
        className="-mx-1 flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible"
      >
        {NAV.map(({ href, key, Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-grove-soft font-medium text-grove" : "text-muted hover:bg-grove-soft/60 hover:text-ink"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
