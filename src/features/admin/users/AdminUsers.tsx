"use client";

import { useState } from "react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Dialog from "@/components/dialog/Dialog";
import PageNav from "@/components/page-nav/PageNav";
import StarRating from "@/components/stars/StarRating";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { FilterBar, SelectFilter } from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StatCard from "@/components/ui/StatCard";
import { ROLE } from "@/lib/enums";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { num } from "@/features/market/format";
import FarmStatusBadge from "@/features/merchant/farms/FarmStatusBadge";
import { norm } from "@/features/orders/status";
import adminDict from "../admin.i18n";
import { adminMutate, useAdminAction, useAdminList, useAdminQuery } from "../admin-api";
import ReasonDialog from "../ReasonDialog";
import dict from "./users.i18n";

interface AdminUser {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  isActive?: boolean;
  isVerified?: boolean;
  promotionStatus?: string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number | string | null;
  createdAt?: string;
  farms?: { id: string; name: string; status?: string }[];
  /** Counts from the detail endpoint. The detail endpoint sends counts, not the order lists. */
  orderCounts?: { asBuyer?: number; asMerchant?: number } | null;
}
interface Stats {
  total?: number;
  buyers?: number;
  merchants?: number;
  admins?: number;
  active?: number;
  suspended?: number;
}

type Dlg = { kind: "approve" | "suspend" | "reinstate" | "reject" | "view"; user: AdminUser } | null;

function UserDetail({ id }: { id: string }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const q = useAdminQuery<AdminUser>("user", `/users/${id}`);

  return (
    <QueryState q={q} skeleton={<div className="h-40 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}>
      {(u) => {
        const roleKey = norm(u.role);
        const rows: [string, string][] = [
          [t("colUser"), u.fullName ?? t("none")],
          [t("emailLabel"), u.email ?? t("none")],
          [t("colContact"), u.phone ?? t("none")],
          [
            t("role"),
            (["BUYER", "MERCHANT", "ADMIN"] as const).find((r) => r === roleKey) ? t(roleKey as "BUYER") : u.role,
          ],
          [t("colJoined"), fmtDate(u.createdAt, locale)],
          [t("verification"), u.isVerified ? t("verified") : t("notVerified")],
          [t("promotion"), u.promotionStatus ?? t("none")],
          [t("ordersAsBuyer"), String(u.orderCounts?.asBuyer ?? 0)],
          [t("ordersAsMerchant"), String(u.orderCounts?.asMerchant ?? 0)],
        ];
        return (
          <dl className="space-y-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            {num(u.ratingAvg) ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">{t("rating")}</dt>
                <dd className="flex items-center gap-2">
                  <StarRating value={num(u.ratingAvg) ?? 0} size="size-4" />
                  <span className="figure text-muted">({num(u.ratingCount) ?? 0})</span>
                </dd>
              </div>
            ) : null}
            {(u.farms?.length ?? 0) > 0 && (
              <div>
                <dt className="mb-2 text-muted">{t("farms")}</dt>
                <dd className="space-y-2">
                  {u.farms?.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                      <span>{f.name}</span>
                      <FarmStatusBadge status={f.status} />
                    </div>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        );
      }}
    </QueryState>
  );
}

export default function AdminUsers() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const { locale } = useLocale();
  const act = useAdminAction();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [dlg, setDlg] = useState<Dlg>(null);

  const stats = useAdminQuery<Stats>("user-stats", "/users/stats");
  const pending = useAdminQuery<AdminUser[]>("pending-merchants", "/users/pending-merchants");
  const q = useAdminList<AdminUser>("users", "/users", page, { role: role ? ROLE[role as keyof typeof ROLE] : undefined });

  const done = async (fn: () => Promise<unknown>) => {
    if (await act.run(fn)) setDlg(null);
  };

  return (
    <div className="space-y-10">
      <PageHead title={t("title")} sub={t("sub")} />
      {act.error && <Alert tone="error">{act.error}</Alert>}

      <QueryState q={stats} skeleton={<div className="h-24 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}>
        {(s) => (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label={t("total")} value={s.total ?? 0} />
            <StatCard label={t("buyers")} value={s.buyers ?? 0} />
            <StatCard label={t("merchants")} value={s.merchants ?? 0} tone="grove" />
            <StatCard label={t("admins")} value={s.admins ?? 0} />
            <StatCard label={t("active")} value={s.active ?? 0} tone="grove" />
            <StatCard label={t("suspended")} value={s.suspended ?? 0} tone="pomegranate" />
          </dl>
        )}
      </QueryState>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">{t("pendingTitle")}</h2>
        <QueryState
          q={pending}
          isEmpty={(d) => d.length === 0}
          empty={<p className="text-muted">{t("pendingEmpty")}</p>}
          skeleton={<div className="h-20 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}
        >
          {(list) => (
            <ul className="space-y-3">
              {list.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{u.fullName}</p>
                    <p className="text-sm text-muted">
                      {u.email} {u.phone ? `· ${u.phone}` : ""} · {fmtDate(u.createdAt, locale)}
                    </p>
                  </div>
                  <button type="button" disabled={act.busy} onClick={() => setDlg({ kind: "approve", user: u })} className="btn btn-solid h-10 px-4">
                    {t("approve")}
                  </button>
                  <button type="button" disabled={act.busy} onClick={() => setDlg({ kind: "reject", user: u })} className="btn btn-line h-10 px-4 text-pomegranate">
                    {t("reject")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </section>

      <section>
        <FilterBar>
          <SelectFilter
            label={t("role")}
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            options={[
              { value: "", label: ta("all") },
              { value: "BUYER", label: t("BUYER") },
              { value: "MERCHANT", label: t("MERCHANT") },
              { value: "ADMIN", label: t("ADMIN") },
            ]}
          />
        </FilterBar>
        <QueryState q={q} isEmpty={(d) => d.items.length === 0} empty={<p className="py-8 text-center text-muted">{ta("empty")}</p>}>
          {(d) => (
            <>
              <DataTable
                caption={t("title")}
                rows={d.items}
                rowKey={(u) => u.id}
                columns={[
                  {
                    key: "user",
                    header: t("colUser"),
                    cell: (u) => (
                      <>
                        <p className="font-medium">{u.fullName ?? t("none")}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </>
                    ),
                  },
                  { key: "contact", header: t("colContact"), cell: (u) => <span className="figure">{u.phone ?? t("none")}</span> },
                  {
                    key: "role",
                    header: t("role"),
                    cell: (u) => (
                      <Badge tone="go">
                        {(["BUYER", "MERCHANT", "ADMIN"] as const).find((r) => r === norm(u.role)) ? t(norm(u.role) as "BUYER") : u.role}
                      </Badge>
                    ),
                  },
                  {
                    key: "status",
                    header: ta("status"),
                    cell: (u) => <Badge tone={u.isActive === false ? "stop" : "go"}>{u.isActive === false ? t("suspended1") : t("active1")}</Badge>,
                  },
                  { key: "joined", header: t("colJoined"), cell: (u) => fmtDate(u.createdAt, locale) },
                  {
                    key: "actions",
                    header: ta("actions"),
                    cell: (u) => (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setDlg({ kind: "view", user: u })} className="btn btn-line h-8 px-3 text-xs">
                          {ta("view")}
                        </button>
                        {norm(u.role) !== "ADMIN" &&
                          (u.isActive === false ? (
                            <button type="button" onClick={() => setDlg({ kind: "reinstate", user: u })} className="btn btn-line h-8 px-3 text-xs">
                              {t("reinstate")}
                            </button>
                          ) : (
                            <button type="button" onClick={() => setDlg({ kind: "suspend", user: u })} className="btn btn-line h-8 px-3 text-xs text-pomegranate">
                              {t("suspend")}
                            </button>
                          ))}
                      </div>
                    ),
                  },
                ]}
              />
              <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
            </>
          )}
        </QueryState>
      </section>

      <Dialog open={dlg?.kind === "view"} title={t("detail")} onClose={() => setDlg(null)} wide>
        {dlg?.kind === "view" && <UserDetail id={dlg.user.id} />}
      </Dialog>
      <ConfirmDialog
        open={dlg?.kind === "approve"}
        title={t("approveTitle")}
        body={t("approveBody")}
        confirmLabel={t("approveConfirm")}
        cancelLabel={ta("cancel")}
        busy={act.busy}
        onConfirm={() => dlg && void done(() => adminMutate("PUT", `/users/${dlg.user.id}/make-merchant`))}
        onClose={() => !act.busy && setDlg(null)}
      />
      <ReasonDialog
        open={dlg?.kind === "suspend"}
        title={t("suspendTitle")}
        body={t("suspendBody")}
        confirmLabel={t("suspendConfirm")}
        danger
        busy={act.busy}
        onConfirm={(reason) => dlg && void done(() => adminMutate("PUT", `/users/${dlg.user.id}/suspend`, { reason: reason || undefined }))}
        onClose={() => !act.busy && setDlg(null)}
      />
      <ReasonDialog
        open={dlg?.kind === "reject"}
        title={t("rejectTitle")}
        body={t("rejectBody")}
        confirmLabel={t("rejectConfirm")}
        danger
        busy={act.busy}
        onConfirm={(reason) => dlg && void done(() => adminMutate("PUT", `/users/${dlg.user.id}/reject-merchant`, { notes: reason || undefined }))}
        onClose={() => !act.busy && setDlg(null)}
      />
      <ConfirmDialog
        open={dlg?.kind === "reinstate"}
        title={t("reinstateTitle")}
        body={t("reinstateBody")}
        confirmLabel={t("reinstateConfirm")}
        cancelLabel={ta("cancel")}
        busy={act.busy}
        onConfirm={() => dlg && void done(() => adminMutate("PUT", `/users/${dlg.user.id}/reinstate`))}
        onClose={() => !act.busy && setDlg(null)}
      />
    </div>
  );
}
