"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Alert from "@/components/Alert";
import PageNav from "@/components/page-nav/PageNav";
import DataTable from "@/components/ui/DataTable";
import {
  FilterBar,
  SearchFilter,
  SelectFilter,
} from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StatCard from "@/components/ui/StatCard";
import { FARM_STATUS } from "@/lib/enums";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import FarmStatusBadge from "@/features/merchant/farms/FarmStatusBadge";
import type { Farm } from "@/features/merchant/farms/farms-types";
import adminDict from "../admin.i18n";
import { useAdminAction, useAdminList, useAdminQuery } from "../admin-api";
import FarmActions from "./FarmActions";
import dict from "./farms.i18n";

type Row = Farm & {
  owner?: { fullName?: string | null; email?: string | null } | null;
  location?: string | null;
  createdAt?: string;
};
const FILTERS = ["pending", "approved", "rejected", "suspended"] as const;

// API stat keys -> translation keys. Status counts reuse the filter labels.
const STAT_LABELS = {
  total: "statTotal",
  pending: "filterPending",
  approved: "filterApproved",
  rejected: "filterRejected",
  suspended: "filterSuspended",
} as const;
type StatKey = keyof typeof STAT_LABELS;
const isStatKey = (k: string): k is StatKey =>
  (Object.keys(STAT_LABELS) as string[]).includes(k);

function AdminFarmsBody() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const { locale } = useLocale();
  const act = useAdminAction();
  const initial = useSearchParams().get("status") ?? "";
  const [status, setStatus] = useState<string>(
    (FILTERS as readonly string[]).includes(initial) ? initial : ""
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const stats = useAdminQuery<Record<string, unknown>>(
    "farm-stats",
    "/farms/stats"
  );
  // One list for every filter, pending included. The old separate pending endpoint took no search
  // term, so the search box did nothing under that filter.
  const q = useAdminList<Row>("farms", "/farms", page, {
    status: status
      ? FARM_STATUS[status.toUpperCase() as keyof typeof FARM_STATUS]
      : undefined,
    search,
  });

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
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(s)
              .filter(
                ([, v]) =>
                  typeof v === "number" ||
                  (typeof v === "string" &&
                    v !== "" &&
                    !Number.isNaN(Number(v)))
              )
              .map(([k, v]) => (
                <StatCard
                  key={k}
                  label={
                    isStatKey(k)
                      ? t(STAT_LABELS[k])
                      : k.replace(/([A-Z])/g, " $1").toLowerCase()
                  }
                  value={Number(v)}
                />
              ))}
          </dl>
        )}
      </QueryState>

      <div>
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
              ...FILTERS.map((f) => ({
                value: f,
                label: t(
                  `filter${f[0].toUpperCase()}${f.slice(1)}` as "filterPending"
                ),
              })),
            ]}
          />
          <SearchFilter
            label={ta("search")}
            buttonLabel={ta("search")}
            placeholder={t("search")}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
        </FilterBar>

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
                rowKey={(f) => f.id}
                columns={[
                  {
                    key: "farm",
                    header: t("colFarm"),
                    cell: (f) => (
                      <Link
                        href={`/admin/farms/${f.id}`}
                        className="font-medium text-grove hover:underline"
                      >
                        {f.displayName || f.name}
                      </Link>
                    ),
                  },
                  {
                    key: "owner",
                    header: t("colOwner"),
                    cell: (f) => (
                      <>
                        <p>{f.owner?.fullName ?? "—"}</p>
                        <p className="text-xs text-muted">{f.owner?.email}</p>
                      </>
                    ),
                  },
                  {
                    key: "loc",
                    header: t("colLocation"),
                    cell: (f) => f.locationText ?? f.location ?? "—",
                  },
                  {
                    key: "status",
                    header: ta("status"),
                    cell: (f) => <FarmStatusBadge status={f.status} />,
                  },
                  {
                    key: "created",
                    header: t("colCreated"),
                    cell: (f) => fmtDate(f.createdAt, locale),
                  },
                  {
                    key: "actions",
                    header: ta("actions"),
                    cell: (f) => (
                      <FarmActions
                        id={f.id}
                        status={f.status}
                        run={act.run}
                        busy={act.busy}
                        compact
                      />
                    ),
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
    </div>
  );
}

export default withSuspense(AdminFarmsBody);
