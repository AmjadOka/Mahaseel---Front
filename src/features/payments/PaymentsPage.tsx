"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import Money from "@/components/Money";
import Badge, { type Tone } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { apiGet } from "@/lib/api/client";
import { asList } from "@/lib/api/paginate";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import { num } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import dict from "./payments.i18n";

interface PaymentRow {
  id: string;
  orderId?: string;
  amount: number | string;
  currency?: string | null;
  status: string;
  paidAt?: string | null;
  createdAt?: string;
  order?: { id?: string; product?: { name?: string } | null } | null;
}

const TONE: Record<string, Tone> = { PENDING: "pay", PROCESSING: "go", PAID: "done", FAILED: "stop", REFUNDED: "stop" };

export default function PaymentsPage() {
  const ready = useRequireAuth();
  const t = useT(dict);
  const { locale } = useLocale();
  const q = useQuery({ queryKey: ["payments"], queryFn: async () => asList<PaymentRow>(await apiGet<unknown>("/payments")), enabled: ready });

  return (
    <div className="wrap py-10 lg:py-14">
      <PageHead title={t("histTitle")} sub={t("histSub")} />
      {ready && (
        <QueryState q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={CreditCard} title={t("histEmpty")} hint={t("histEmptyHint")} />}>
          {(rows) => (
            <ul className="space-y-3">
              {rows.map((p) => {
                const st = norm(p.status);
                const orderId = p.orderId ?? p.order?.id;
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium">{p.order?.product?.name ?? t("deletedProduct")}</p>
                      <p className="text-sm text-muted">{p.paidAt ? t("paidOn", { date: fmtDate(p.paidAt, locale) }) : t("createdOn", { date: fmtDate(p.createdAt, locale) })}</p>
                    </div>
                    {/* Every amount in the app is shown in the app currency (ILS, set on the payment row). Money formats it the same way everywhere. */}
                    <Money value={num(p.amount)} className="font-display text-xl font-bold" />
                    <Badge tone={TONE[st] ?? "wait"}>{st in TONE ? t(st as "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "REFUNDED") : t("UNKNOWN")}</Badge>
                    {orderId && (
                      <Link href={`/orders/${orderId}`} className="btn btn-line h-9 px-4">
                        {t("viewOrder")}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </QueryState>
      )}
    </div>
  );
}
