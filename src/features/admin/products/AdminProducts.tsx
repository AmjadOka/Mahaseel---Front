"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Countdown from "@/components/countdown/Countdown";
import Money from "@/components/Money";
import PageNav from "@/components/page-nav/PageNav";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { FilterBar, SelectFilter } from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StatCard from "@/components/ui/StatCard";
import { PRODUCT_STATUS, SALE_METHOD } from "@/lib/enums";
import { useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { fmtNum, isAuction, num } from "@/features/market/format";
import type { Product } from "@/features/market/types";
import { ProductStatusBadge } from "@/features/merchant/products/ProductsList";
import { norm } from "@/features/orders/status";
import adminDict from "../admin.i18n";
import {
  adminMutate,
  useAdminAction,
  useAdminList,
  useAdminQuery,
} from "../admin-api";
import ReasonDialog from "../ReasonDialog";
import dict from "./products.i18n";

type Row = Product & {
  farm?: { name?: string | null } | null;
  bids?: unknown[];
  bidCount?: number;
};
type Dlg = { kind: "deactivate" | "reactivate"; p: Row } | null;
const STATUSES = [
  "ACTIVE",
  "PENDING_REVIEW",
  "DRAFT",
  "SOLD",
  "EXPIRED",
  "REJECTED",
  "ARCHIVED",
  "INACTIVE",
] as const;

function AdminProductsBody() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const act = useAdminAction();
  const [tab, setTab] = useState<"all" | "live">(
    useSearchParams().get("tab") === "live" ? "live" : "all"
  );
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [dlg, setDlg] = useState<Dlg>(null);

  const stats = useAdminQuery<Record<string, number>>(
    "product-stats",
    "/products/stats"
  );
  const q = useAdminList<Row>(
    "products",
    tab === "live" ? "/products/auctions/live" : "/products",
    page,
    tab === "all"
      ? {
          status: status
            ? PRODUCT_STATUS[status as keyof typeof PRODUCT_STATUS]
            : undefined,
          saleMethod: method
            ? SALE_METHOD[method as "FIXED" | "AUCTION"]
            : undefined,
        }
      : {}
  );

  const done = async (fn: () => Promise<unknown>) => {
    if (await act.run(fn)) setDlg(null);
  };
  const tabBtn = (k: "all" | "live", label: string) => (
    <button
      key={k}
      type="button"
      role="tab"
      aria-selected={tab === k}
      onClick={() => {
        setTab(k);
        setPage(1);
      }}
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
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <StatCard label={t("total")} value={s.total ?? 0} />
            <StatCard label={t("active")} value={s.active ?? 0} tone="grove" />
            <StatCard label={t("sold")} value={s.sold ?? 0} />
            <StatCard label={t("expired")} value={s.expired ?? 0} />
            <StatCard
              label={t("inactive")}
              value={s.inactive ?? 0}
              tone="pomegranate"
            />
            <StatCard label={t("fixedPrice")} value={s.fixedPrice ?? 0} />
            <StatCard label={t("auctions")} value={s.auction ?? 0} />
            <StatCard
              label={t("live")}
              value={s.liveAuctions ?? 0}
              tone="pomegranate"
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
          {tabBtn("live", t("tabLive"))}
        </div>
        {tab === "all" && (
          <FilterBar>
            <SelectFilter
              label={ta("status")}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                { value: "", label: ta("all") },
                ...STATUSES.map((s) => ({
                  value: s,
                  label: t(`st_${s}` as "st_ACTIVE"),
                })),
              ]}
            />
            <SelectFilter
              label={t("method")}
              value={method}
              onChange={(v) => {
                setMethod(v);
                setPage(1);
              }}
              options={[
                { value: "", label: ta("all") },
                { value: "FIXED", label: t("fixed") },
                { value: "AUCTION", label: t("auction") },
              ]}
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
                rowKey={(p) => p.id}
                columns={[
                  {
                    key: "p",
                    header: t("colProduct"),
                    cell: (p) => (
                      <Link
                        href={`/market/${p.id}`}
                        className="font-medium text-grove hover:underline"
                      >
                        {p.name}
                      </Link>
                    ),
                  },
                  {
                    key: "farm",
                    header: t("colFarm"),
                    cell: (p) => p.farm?.name ?? "—",
                  },
                  {
                    key: "price",
                    header: t("colPrice"),
                    cell: (p) => (
                      <Money
                        value={
                          isAuction(p)
                            ? num(p.currentBid) ?? num(p.auctionStartPrice)
                            : num(p.fixedPrice)
                        }
                      />
                    ),
                  },
                  {
                    key: "qty",
                    header: t("colQty"),
                    cell: (p) => (
                      <span className="figure">
                        {fmtNum(
                          num(p.availableQuantity) ?? num(p.quantity) ?? 0
                        )}
                      </span>
                    ),
                  },
                  {
                    key: "m",
                    header: t("method"),
                    cell: (p) => (
                      <Badge tone={isAuction(p) ? "pay" : "go"}>
                        {isAuction(p) ? t("auction") : t("fixed")}
                      </Badge>
                    ),
                  },
                  tab === "live"
                    ? {
                        key: "ends",
                        header: t("colEnds"),
                        cell: (p: Row) =>
                          p.auctionEndAt ? (
                            <Countdown endAt={p.auctionEndAt} />
                          ) : (
                            "—"
                          ),
                      }
                    : {
                        key: "st",
                        header: ta("status"),
                        cell: (p: Row) => (
                          <ProductStatusBadge status={p.status} />
                        ),
                      },
                  ...(tab === "live"
                    ? [
                        {
                          key: "bids",
                          header: t("colBids"),
                          cell: (p: Row) => (
                            <span className="figure">
                              {p.bidCount ?? p.bids?.length ?? 0}
                            </span>
                          ),
                        },
                      ]
                    : []),
                  {
                    key: "actions",
                    header: ta("actions"),
                    cell: (p: Row) =>
                      norm(p.status) === "INACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => setDlg({ kind: "reactivate", p })}
                          className="btn btn-line h-8 px-3 text-xs"
                        >
                          {t("reactivate")}
                        </button>
                      ) : norm(p.status) === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => setDlg({ kind: "deactivate", p })}
                          className="btn btn-line h-8 px-3 text-xs text-pomegranate"
                        >
                          {t("deactivate")}
                        </button>
                      ) : null,
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

      <ReasonDialog
        open={dlg?.kind === "deactivate"}
        title={t("deactivateTitle")}
        body={t("deactivateBody")}
        confirmLabel={t("deactivateConfirm")}
        minLength={5}
        danger
        busy={act.busy}
        onConfirm={(reason) =>
          dlg &&
          void done(() =>
            adminMutate("PUT", `/products/${dlg.p.id}/deactivate`, { reason })
          )
        }
        onClose={() => !act.busy && setDlg(null)}
      />
      <ConfirmDialog
        open={dlg?.kind === "reactivate"}
        title={t("reactivateTitle")}
        body={t("reactivateBody")}
        confirmLabel={t("reactivate")}
        cancelLabel={ta("cancel")}
        busy={act.busy}
        onConfirm={() =>
          dlg &&
          void done(() =>
            adminMutate("PUT", `/products/${dlg.p.id}/reactivate`)
          )
        }
        onClose={() => !act.busy && setDlg(null)}
      />
    </div>
  );
}

export default withSuspense(AdminProductsBody);
