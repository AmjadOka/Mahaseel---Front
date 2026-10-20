"use client";

import { useState } from "react";
import Money from "@/components/Money";
import BarChart from "@/components/ui/BarChart";
import DataTable from "@/components/ui/DataTable";
import { FilterBar, SelectFilter, TextFilter } from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StatCard from "@/components/ui/StatCard";
import { useT } from "@/lib/i18n/LocaleProvider";
import { fmtNum } from "@/features/market/format";
import adminDict from "../admin.i18n";
import { dayEnd, dayStart, useAdminQuery } from "../admin-api";
import dict from "./reports.i18n";

interface Day {
  date: string;
  revenue: number;
  platformFee: number;
  orderCount: number;
}
interface Month {
  month: string;
  revenue: number;
  platformFee: number;
  orderCount: number;
}
interface Top {
  merchantId: string;
  /** The merchant's name. The server sends a name, not a phone number. */
  name?: string | null;
  orderCount: number;
  totalRevenue: number;
  platformFees: number;
}
interface Breakdown {
  fixed: number;
  auction: number;
  total: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Reports() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const range = { from: dayStart(from), to: dayEnd(to) };

  const daily = useAdminQuery<Day[]>("r-daily", "/reports/revenue/daily", range);
  const breakdown = useAdminQuery<Breakdown>("r-breakdown", "/reports/revenue/breakdown", range);
  const top = useAdminQuery<Top[]>("r-top", "/reports/merchants/top", { ...range, limit: "10" });
  const monthly = useAdminQuery<Month[]>("r-monthly", "/reports/revenue/monthly", { year: String(year) });
  const money = (n: number) => `${fmtNum(n)} ₪`;

  return (
    <div className="space-y-10">
      <PageHead title={t("title")} sub={t("sub")} />
      <FilterBar>
        <TextFilter label={ta("from")} type="date" value={from} onChange={setFrom} />
        <TextFilter label={ta("to")} type="date" value={to} onChange={setTo} />
      </FilterBar>

      <QueryState
        q={daily}
        skeleton={<div className="h-64 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}
        isEmpty={(d) => d.length === 0}
        empty={<p className="py-8 text-center text-muted">{t("noData")}</p>}
      >
        {(rows) => {
          const chrono = [...rows].reverse(); // the API answers newest-first
          return (
            <>
              <dl className="grid gap-4 sm:grid-cols-3">
                <StatCard label={t("revenue")} value={<Money value={rows.reduce((s, r) => s + Number(r.revenue), 0)} />} tone="grove" />
                <StatCard label={t("fees")} value={<Money value={rows.reduce((s, r) => s + Number(r.platformFee), 0)} />} tone="oil" />
                <StatCard label={t("orders")} value={rows.reduce((s, r) => s + Number(r.orderCount), 0)} />
              </dl>
              <section>
                <h2 className="mb-4 font-display text-lg font-bold">{t("daily")}</h2>
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <BarChart
                    label={t("dailyLabel")}
                    data={chrono.map((r) => ({ label: String(r.date).slice(5, 10), value: Number(r.revenue) }))}
                    format={money}
                  />
                </div>
              </section>
            </>
          );
        }}
      </QueryState>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">{t("breakdown")}</h2>
        <QueryState q={breakdown} skeleton={<div className="h-16 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}>
          {(b) => {
            const total = Number(b.total) || 0;
            const pct = (n: number) => (total ? Math.round((Number(n) / total) * 100) : 0);
            return (
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div
                  className="flex h-4 overflow-hidden rounded-full bg-line [direction:ltr]"
                  role="img"
                  aria-label={`${t("fixed")} ${pct(b.fixed)}% / ${t("auction")} ${pct(b.auction)}%`}
                >
                  <div className="bg-grove" style={{ width: `${pct(b.fixed)}%` }} />
                  <div className="bg-pomegranate" style={{ width: `${pct(b.auction)}%` }} />
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <dt className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm bg-grove" aria-hidden="true" />
                      {t("fixed")}
                    </dt>
                    <dd className="font-medium">
                      <Money value={Number(b.fixed) || 0} />{" "}
                      <span className="figure text-muted">({pct(b.fixed)}%)</span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <dt className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm bg-pomegranate" aria-hidden="true" />
                      {t("auction")}
                    </dt>
                    <dd className="font-medium">
                      <Money value={Number(b.auction) || 0} />{" "}
                      <span className="figure text-muted">({pct(b.auction)}%)</span>
                    </dd>
                  </div>
                </dl>
              </div>
            );
          }}
        </QueryState>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">{t("top")}</h2>
        <QueryState
          q={top}
          isEmpty={(d) => d.length === 0}
          empty={<p className="text-muted">{t("noData")}</p>}
          skeleton={<div className="h-40 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}
        >
          {(rows) => (
            <DataTable
              caption={t("top")}
              rows={rows}
              rowKey={(r) => r.merchantId}
              columns={[
                {
                  key: "m",
                  header: t("colMerchant"),
                  cell: (r) => (
                    <>
                      <p className="font-medium">{r.name ?? "—"}</p>
                      <p className="figure text-xs text-muted">{r.merchantId.slice(0, 8)}</p>
                    </>
                  ),
                },
                { key: "o", header: t("colOrders"), cell: (r) => <span className="figure">{r.orderCount}</span> },
                { key: "r", header: t("colRevenue"), cell: (r) => <Money value={Number(r.totalRevenue)} className="font-bold" /> },
                { key: "f", header: t("colFees"), cell: (r) => <Money value={Number(r.platformFees)} /> },
              ]}
            />
          )}
        </QueryState>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{t("monthly")}</h2>
          <SelectFilter
            label={t("year")}
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => ({ value: y, label: y }))}
          />
        </div>
        <QueryState q={monthly} skeleton={<div className="h-44 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}>
          {(rows) => (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <BarChart
                label={t("monthlyLabel", { year })}
                data={rows.map((r) => ({ label: r.month.slice(5), value: Number(r.revenue) || 0 }))}
                format={money}
              />
            </div>
          )}
        </QueryState>
      </section>
    </div>
  );
}
