"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Alert from "@/components/Alert";
import Dialog from "@/components/dialog/Dialog";
import Money from "@/components/Money";
import PageNav from "@/components/page-nav/PageNav";
import DataTable from "@/components/ui/DataTable";
import {
  FilterBar,
  SelectFilter,
  TextFilter,
} from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StatCard from "@/components/ui/StatCard";
import { ORDER_STATUS } from "@/lib/enums";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { fmtNum, num } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import StatusBadge from "@/features/orders/StatusBadge";
import type { Order } from "@/features/orders/types";
import adminDict from "../admin.i18n";
import {
  adminMutate,
  dayEnd,
  dayStart,
  useAdminAction,
  useAdminList,
  useAdminQuery,
} from "../admin-api";
import ReasonDialog from "../ReasonDialog";
import dict from "./orders.i18n";

type Row = Order & {
  merchant?: { fullName?: string | null } | null;
  payment?: { status?: string } | null;
  platformFee?: number | string | null;
  netAmount?: number | string | null;
};
type Dlg = { kind: "cancel" | "complete" | "view"; o: Row } | null;
const STATUSES = [
  "PENDING",
  "AWAITING_PAYMENT",
  "ACCEPTED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "REFUNDED",
] as const;

function AdminOrdersBody() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const { locale } = useLocale();
  const act = useAdminAction();
  const [tab, setTab] = useState<"all" | "disputes">(
    useSearchParams().get("tab") === "disputes" ? "disputes" : "all"
  );
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [dlg, setDlg] = useState<Dlg>(null);

  const stats = useAdminQuery<Record<string, number>>(
    "order-stats",
    "/orders/stats"
  );
  const q = useAdminList<Row>(
    "orders",
    tab === "disputes" ? "/orders/disputes" : "/orders",
    page,
    tab === "all"
      ? {
          status: status
            ? ORDER_STATUS[status as keyof typeof ORDER_STATUS]
            : undefined,
          from: dayStart(from),
          to: dayEnd(to),
        }
      : {}
  );

  const done = async (fn: () => Promise<unknown>) => {
    if (await act.run(fn)) setDlg(null);
  };
  const reset = (f: () => void) => {
    f();
    setPage(1);
  };
  const tabBtn = (k: "all" | "disputes", label: string) => (
    <button
      key={k}
      type="button"
      role="tab"
      aria-selected={tab === k}
      onClick={() => reset(() => setTab(k))}
      className={`rounded-full px-5 py-2 text-sm transition-colors ${
        tab === k
          ? "bg-grove-soft font-medium text-grove ring-1 ring-grove/40"
          : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <PageHead title={t("title")} sub={t("sub")} />
      {act.error && <Alert tone="error">{act.error}</Alert>}

      <QueryState
        q={stats}
        skeleton={
          <div className="h-20 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />
        }
      >
        {(s) => (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <StatCard label={t("total")} value={s.total ?? 0} />
            <StatCard label={t("pending")} value={s.pending ?? 0} tone="oil" />
            <StatCard
              label={t("awaiting")}
              value={s.awaitingPayment ?? 0}
              tone="pomegranate"
            />
            <StatCard label={t("accepted")} value={s.accepted ?? 0} />
            <StatCard
              label={t("completed")}
              value={s.completed ?? 0}
              tone="grove"
            />
            <StatCard label={t("cancelled")} value={s.cancelled ?? 0} />
            <StatCard label={t("rejected")} value={s.rejected ?? 0} />
            <StatCard
              label={t("disputes")}
              value={s.openDisputes ?? 0}
              tone="pomegranate"
            />
            <StatCard
              label={t("revenue")}
              value={<Money value={Number(s.totalRevenue) || 0} />}
              tone="grove"
            />
            <StatCard
              label={t("fees")}
              value={<Money value={Number(s.totalPlatformFees) || 0} />}
              tone="oil"
            />
          </dl>
        )}
      </QueryState>

      <div>
        <div
          role="tablist"
          className="mb-5 inline-flex gap-1 rounded-full border border-line bg-surface p-1"
        >
          {tabBtn("all", t("tabAll"))}
          {tabBtn("disputes", t("tabDisputes"))}
        </div>
        {tab === "all" && (
          <FilterBar>
            <SelectFilter
              label={t("filterStatus")}
              value={status}
              onChange={(v) => reset(() => setStatus(v))}
              options={[
                { value: "", label: ta("all") },
                ...STATUSES.map((s) => ({
                  value: s,
                  label: t(`ST_${s}` as "ST_PENDING"),
                })),
              ]}
            />
            <TextFilter
              label={ta("from")}
              type="date"
              value={from}
              onChange={(v) => reset(() => setFrom(v))}
            />
            <TextFilter
              label={ta("to")}
              type="date"
              value={to}
              onChange={(v) => reset(() => setTo(v))}
            />
          </FilterBar>
        )}

        <QueryState
          q={q}
          isEmpty={(d) => d.items.length === 0}
          empty={<p className="py-8 text-center text-muted">{ta("empty")}</p>}
        >
          {(d) => (
            <>
              <DataTable
                caption={t("title")}
                rows={d.items}
                rowKey={(o) => o.id}
                columns={[
                  {
                    key: "o",
                    header: t("colOrder"),
                    cell: (o) => (
                      <>
                        <p className="font-medium">{o.product?.name ?? "—"}</p>
                        <p className="figure text-xs text-muted">
                          {fmtNum(num(o.quantity) ?? 0)} {o.unit}
                        </p>
                      </>
                    ),
                  },
                  {
                    key: "b",
                    header: t("colBuyer"),
                    cell: (o) => o.buyer?.fullName ?? o.buyer?.email ?? "—",
                  },
                  {
                    key: "m",
                    header: t("colMerchant"),
                    cell: (o) => o.merchant?.fullName ?? "—",
                  },
                  // Before acceptance there is no final price, so the offered price is shown.
                  {
                    key: "t",
                    header: t("colTotal"),
                    cell: (o) => (
                      <Money value={num(o.finalPrice ?? o.offeredPrice)} />
                    ),
                  },
                  {
                    key: "s",
                    header: ta("status"),
                    cell: (o) => <StatusBadge order={o} />,
                  },
                  {
                    key: "p",
                    header: t("colPayment"),
                    cell: (o) => o.payment?.status ?? t("paymentNone"),
                  },
                  {
                    key: "d",
                    header: t("colDate"),
                    cell: (o) => fmtDate(o.createdAt, locale),
                  },
                  {
                    key: "a",
                    header: ta("actions"),
                    cell: (o) => {
                      const s = norm(o.status);
                      const closed = s === "COMPLETED" || s === "CANCELLED";
                      return (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDlg({ kind: "view", o })}
                            className="btn btn-line h-8 px-3 text-xs"
                          >
                            {ta("view")}
                          </button>
                          {!closed && (
                            <button
                              type="button"
                              onClick={() => setDlg({ kind: "cancel", o })}
                              className="btn btn-line h-8 px-3 text-xs text-pomegranate"
                            >
                              {t("cancel")}
                            </button>
                          )}
                          {!closed && (
                            <button
                              type="button"
                              onClick={() => setDlg({ kind: "complete", o })}
                              className="btn btn-line h-8 px-3 text-xs"
                            >
                              {t("complete")}
                            </button>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
              />
              <PageNav
                page={d.page}
                totalPages={d.totalPages}
                onPage={setPage}
              />
            </>
          )}
        </QueryState>
      </div>

      <Dialog
        open={dlg?.kind === "view"}
        title={t("detail")}
        onClose={() => setDlg(null)}
        wide
      >
        {dlg?.kind === "view" && (
          <dl className="space-y-3 text-sm">
            {(
              [
                [t("colOrder"), dlg.o.product?.name],
                [
                  t("quantity"),
                  `${fmtNum(num(dlg.o.quantity) ?? 0)} ${dlg.o.unit}`,
                ],
                [
                  t("colTotal"),
                  `${fmtNum(
                    num(dlg.o.finalPrice ?? dlg.o.offeredPrice) ?? 0
                  )} ₪`,
                ],
                [
                  t("fee"),
                  num(dlg.o.platformFee) !== null
                    ? `${fmtNum(num(dlg.o.platformFee) ?? 0)} ₪`
                    : null,
                ],
                [
                  t("net"),
                  num(dlg.o.netAmount) !== null
                    ? `${fmtNum(num(dlg.o.netAmount) ?? 0)} ₪`
                    : null,
                ],
                [t("colBuyer"), dlg.o.buyer?.fullName ?? dlg.o.buyer?.email],
                [t("colMerchant"), dlg.o.merchant?.fullName],
                [
                  t("delivery"),
                  [dlg.o.deliveryMethod, dlg.o.deliveryStatus]
                    .filter(Boolean)
                    .join(" · "),
                ],
                [t("colPayment"), dlg.o.payment?.status],
                [t("created"), fmtDate(dlg.o.createdAt, locale)],
                [t("notes"), dlg.o.notes],
                [t("rejection"), dlg.o.rejectionReason],
              ] as [string, string | null | undefined][]
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-end font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        )}
      </Dialog>

      {/* Both actions need a reason. The server requires one, and an empty field would fail with 400. */}
      <ReasonDialog
        open={dlg?.kind === "cancel"}
        title={t("cancelTitle")}
        body={t("cancelBody")}
        confirmLabel={t("cancelConfirm")}
        minLength={5}
        danger
        busy={act.busy}
        onConfirm={(reason) =>
          dlg &&
          void done(() =>
            adminMutate("PUT", `/orders/${dlg.o.id}/force-cancel`, { reason })
          )
        }
        onClose={() => !act.busy && setDlg(null)}
      />
      <ReasonDialog
        open={dlg?.kind === "complete"}
        title={t("completeTitle")}
        body={t("completeBody")}
        confirmLabel={t("completeConfirm")}
        minLength={5}
        busy={act.busy}
        onConfirm={(reason) =>
          dlg &&
          void done(() =>
            adminMutate("PUT", `/orders/${dlg.o.id}/force-complete`, { reason })
          )
        }
        onClose={() => !act.busy && setDlg(null)}
      />
    </div>
  );
}

export default withSuspense(AdminOrdersBody);
