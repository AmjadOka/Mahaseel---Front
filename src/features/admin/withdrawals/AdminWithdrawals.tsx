"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Dialog from "@/components/dialog/Dialog";
import { TextAreaField } from "@/components/field/Fields";
import Money from "@/components/Money";
import PageNav from "@/components/page-nav/PageNav";
import Badge, { type Tone } from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { FilterBar, SelectFilter } from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StatCard from "@/components/ui/StatCard";
import { WITHDRAWAL_STATUS } from "@/lib/enums";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { num } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import adminDict from "../admin.i18n";
import {
  adminMutate,
  useAdminAction,
  useAdminList,
  useAdminQuery,
} from "../admin-api";
import dict from "./withdrawals.i18n";

interface Withdrawal {
  id: string;
  amount: number | string;
  status: string;
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  processedAt?: string | null;
  merchant?: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  bankAccount?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    iban?: string | null;
    branchName?: string | null;
  } | null;
}

const TONE: Record<string, Tone> = {
  PENDING: "wait",
  PROCESSING: "go",
  COMPLETED: "done",
  REJECTED: "stop",
};

function StatusPill({ status }: { status: string }) {
  const t = useT(dict);
  const k = norm(status);
  return (
    <Badge tone={TONE[k] ?? "wait"}>
      {k in TONE
        ? t(k as "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED")
        : t("UNKNOWN")}
    </Badge>
  );
}

/**
 * Everything the admin needs to move the money: bank details, then approve (only after the transfer
 * has actually gone out) or reject with a reason the merchant will see.
 *
 * The note box does two jobs. On approval it's an internal note. On rejection it's the reason the
 * merchant sees. The hint says so.
 */
function Review({
  id,
  run,
  busy,
  onDone,
}: {
  id: string;
  run: (fn: () => Promise<unknown>) => Promise<boolean>;
  busy: boolean;
  onDone: () => void;
}) {
  const t = useT(dict);
  const ta = useT(adminDict);
  const q = useAdminQuery<Withdrawal>("withdrawal", `/withdrawals/${id}`);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const spinner = (
    <Loader2
      className="size-4 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
  );

  return (
    <QueryState
      q={q}
      skeleton={
        <div className="h-48 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />
      }
    >
      {(w) => {
        const pending = norm(w.status) === "PENDING";
        const rows: [string, string | null | undefined, boolean][] = [
          [
            t("merchant"),
            [w.merchant?.fullName, w.merchant?.email, w.merchant?.phone]
              .filter(Boolean)
              .join(" · "),
            false,
          ],
          [t("bank"), w.bankAccount?.bankName, false],
          [t("holder"), w.bankAccount?.accountHolderName, false],
          [t("account"), w.bankAccount?.accountNumber, true],
          [t("iban"), w.bankAccount?.iban, true],
          [t("branch"), w.bankAccount?.branchName, false],
          [t("requestNotes"), w.notes, false],
          [t("processedReason"), w.rejectionReason, false],
        ];
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Money
                value={num(w.amount)}
                className="font-display text-3xl font-bold text-grove"
              />
              <StatusPill status={w.status} />
            </div>
            <dl className="divide-y divide-line rounded-xl border border-line text-sm">
              {rows
                .filter(([, v]) => v)
                .map(([k, v, mono]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 px-4 py-2.5"
                  >
                    <dt className="text-muted">{k}</dt>
                    <dd
                      className={`text-end font-medium ${mono ? "figure" : ""}`}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
            </dl>
            {!w.bankAccount && <Alert tone="error">{t("noBank")}</Alert>}

            {pending && !confirming && (
              <>
                <p className="text-sm text-muted">{t("howTo")}</p>
                <TextAreaField
                  label={t("note")}
                  hint={t("noteHint")}
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy || note.trim().length < 5}
                    onClick={async () => {
                      if (
                        await run(() =>
                          adminMutate("PUT", `/withdrawals/${id}/reject`, {
                            reason: note.trim(),
                          })
                        )
                      )
                        onDone();
                    }}
                    className="btn btn-line text-pomegranate"
                  >
                    {t("reject")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirming(true)}
                    className="btn btn-solid"
                  >
                    {t("approve")}
                  </button>
                </div>
              </>
            )}

            {pending && confirming && (
              <div className="space-y-4 rounded-xl border border-line bg-paper p-5">
                <p className="font-medium">{t("confirmApproveTitle")}</p>
                <p className="text-sm text-muted">{t("confirmApproveBody")}</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirming(false)}
                    className="btn btn-line"
                  >
                    {ta("cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await run(() =>
                          adminMutate("PUT", `/withdrawals/${id}/approve`, {
                            adminNotes: note.trim() || undefined,
                          })
                        )
                      )
                        onDone();
                    }}
                    className="btn btn-solid"
                  >
                    {busy && spinner}
                    {t("approveConfirm")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={onDone} className="btn btn-line">
                {ta("close")}
              </button>
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}

function AdminWithdrawalsBody() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const { locale } = useLocale();
  const act = useAdminAction();
  const [tab, setTab] = useState<"all" | "pending">(
    useSearchParams().get("tab") === "pending" ? "pending" : "all"
  );
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const stats = useAdminQuery<Record<string, number>>(
    "withdrawal-stats",
    "/withdrawals/stats"
  );
  const q = useAdminList<Withdrawal>(
    "withdrawals",
    tab === "pending" ? "/withdrawals/pending" : "/withdrawals",
    page,
    tab === "all"
      ? {
          status: status
            ? WITHDRAWAL_STATUS[status as keyof typeof WITHDRAWAL_STATUS]
            : undefined,
        }
      : {}
  );

  const tabBtn = (k: "all" | "pending", label: string) => (
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
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={t("pendingCount")}
              value={s.pending ?? 0}
              tone={s.pending ? "pomegranate" : "ink"}
            />
            <StatCard
              label={t("pendingAmount")}
              value={<Money value={Number(s.totalAmountPending) || 0} />}
              tone="oil"
            />
            <StatCard label={t("completedCount")} value={s.completed ?? 0} />
            <StatCard
              label={t("completedAmount")}
              value={<Money value={Number(s.totalAmountCompleted) || 0} />}
              tone="grove"
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
          {tabBtn("pending", t("tabPending"))}
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
                { value: "PENDING", label: t("PENDING") },
                { value: "PROCESSING", label: t("PROCESSING") },
                { value: "COMPLETED", label: t("COMPLETED") },
                { value: "REJECTED", label: t("REJECTED") },
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
                rowKey={(w) => w.id}
                columns={[
                  {
                    key: "m",
                    header: t("colMerchant"),
                    cell: (w) => (
                      <>
                        <p className="font-medium">
                          {w.merchant?.fullName ?? "—"}
                        </p>
                        <p className="text-xs text-muted">
                          {w.merchant?.email}
                        </p>
                      </>
                    ),
                  },
                  {
                    key: "a",
                    header: t("colAmount"),
                    cell: (w) => (
                      <Money value={num(w.amount)} className="font-bold" />
                    ),
                  },
                  {
                    key: "s",
                    header: ta("status"),
                    cell: (w) => <StatusPill status={w.status} />,
                  },
                  {
                    key: "r",
                    header: t("colRequested"),
                    cell: (w) => fmtDate(w.createdAt, locale),
                  },
                  {
                    key: "p",
                    header: t("colProcessed"),
                    cell: (w) =>
                      w.processedAt ? fmtDate(w.processedAt, locale) : "—",
                  },
                  {
                    key: "x",
                    header: ta("actions"),
                    cell: (w) => (
                      <button
                        type="button"
                        onClick={() => setReviewing(w.id)}
                        className="btn btn-line h-8 px-3 text-xs"
                      >
                        {norm(w.status) === "PENDING"
                          ? t("review")
                          : ta("view")}
                      </button>
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

      <Dialog
        open={!!reviewing}
        title={t("reviewTitle")}
        onClose={() => !act.busy && setReviewing(null)}
        busy={act.busy}
        wide
      >
        {reviewing && (
          <Review
            id={reviewing}
            run={act.run}
            busy={act.busy}
            onDone={() => setReviewing(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

export default withSuspense(AdminWithdrawalsBody);
