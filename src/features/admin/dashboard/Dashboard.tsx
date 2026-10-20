"use client";

import Money from "@/components/Money";
import BarChart from "@/components/ui/BarChart";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StatCard from "@/components/ui/StatCard";
import { useT } from "@/lib/i18n/LocaleProvider";
import { fmtNum } from "@/features/market/format";
import { useAdminQuery } from "../admin-api";
import dict from "./dashboard.i18n";

interface Overview {
  farms?: { pendingApproval?: number };
  withdrawals?: { pendingProcessing?: number };
  auctions?: { active?: number };
  users?: { newToday?: number };
  orders?: { today?: number; openDisputes?: number };
  revenue?: { today?: number; allTime?: number; allTimePlatformFees?: number };
}
interface Month {
  month: string;
  revenue: number;
}

export default function Dashboard() {
  const t = useT(dict);
  const q = useAdminQuery<Overview>("overview", "/admin/dashboard");
  const monthly = useAdminQuery<Month[]>(
    "monthly",
    "/admin/reports/revenue/monthly"
  );

  return (
    <div className="space-y-10">
      <PageHead title={t("title")} sub={t("sub")} />
      <QueryState q={q}>
        {(d) => (
          <>
            <section>
              <h2 className="mb-4 font-display text-lg font-bold">
                {t("attention")}
              </h2>
              <dl className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label={t("pendingFarms")}
                  value={d.farms?.pendingApproval ?? 0}
                  href="/admin/farms?status=pending"
                  tone={d.farms?.pendingApproval ? "pomegranate" : "ink"}
                />
                <StatCard
                  label={t("pendingWithdrawals")}
                  value={d.withdrawals?.pendingProcessing ?? 0}
                  href="/admin/withdrawals?tab=pending"
                  tone={
                    d.withdrawals?.pendingProcessing ? "pomegranate" : "ink"
                  }
                />
                <StatCard
                  label={t("disputes")}
                  value={d.orders?.openDisputes ?? 0}
                  href="/admin/orders?tab=disputes"
                  tone={d.orders?.openDisputes ? "pomegranate" : "ink"}
                />
              </dl>
            </section>
            <section>
              <h2 className="mb-4 font-display text-lg font-bold">
                {t("numbers")}
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label={t("liveAuctions")}
                  value={d.auctions?.active ?? 0}
                  href="/admin/products?tab=live"
                />
                <StatCard
                  label={t("newUsers")}
                  value={d.users?.newToday ?? 0}
                  href="/admin/users"
                />
                <StatCard
                  label={t("ordersToday")}
                  value={d.orders?.today ?? 0}
                  href="/admin/orders"
                />
                <StatCard
                  label={t("revenueToday")}
                  value={<Money value={d.revenue?.today ?? 0} />}
                  tone="grove"
                />
                <StatCard
                  label={t("revenueAll")}
                  value={<Money value={d.revenue?.allTime ?? 0} />}
                  tone="grove"
                />
                <StatCard
                  label={t("fees")}
                  value={<Money value={d.revenue?.allTimePlatformFees ?? 0} />}
                  tone="oil"
                />
              </dl>
            </section>
          </>
        )}
      </QueryState>
      <section>
        <h2 className="mb-4 font-display text-lg font-bold">{t("monthly")}</h2>
        <QueryState
          q={monthly}
          skeleton={
            <div className="h-44 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />
          }
        >
          {(rows) => (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <BarChart
                label={t("monthlyLabel")}
                data={rows.map((r) => ({
                  label: r.month.slice(5),
                  value: Number(r.revenue) || 0,
                }))}
                format={(n) => `${fmtNum(n)} ₪`}
              />
            </div>
          )}
        </QueryState>
      </section>
    </div>
  );
}
