"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Dialog from "@/components/dialog/Dialog";
import Field from "@/components/field/Field";
import { SelectField, TextAreaField } from "@/components/field/Fields";
import Money from "@/components/Money";
import PageNav from "@/components/page-nav/PageNav";
import Badge, { type Tone } from "@/components/ui/Badge";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { useApiError } from "@/lib/api/useApiError";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { fmtNum, num } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import { fetchBankAccounts } from "./bank-api";
import dict from "./wallet.i18n";
import { fetchTransactions, fetchWallet, fetchWithdrawals, requestWithdrawal } from "./wallet-api";

const REASONS = ["ORDER_PAYMENT", "ORDER_EARNING", "ESCROW_HOLD", "ESCROW_RELEASE", "BALANCE_RELEASE", "WITHDRAWAL_REQUESTED", "WITHDRAWAL_COMPLETED", "WITHDRAWAL_REJECTED", "PLATFORM_FEE", "REFUND", "ADMIN_ADJUSTMENT"] as const;
const WD_TONE: Record<string, Tone> = { PENDING: "wait", PROCESSING: "go", COMPLETED: "done", REJECTED: "stop" };

function WithdrawForm({ available, onDone }: { available: number; onDone: () => void }) {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const banks = useQuery({ queryKey: ["bank-accounts"], queryFn: fetchBankAccounts });
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; bank?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = banks.data ?? [];
  const bank = bankId || list.find((b) => b.isDefault)?.id || list[0]?.id || "";

  if (banks.isSuccess && list.length === 0) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{t("noBank")}</Alert>
        <Link href="/merchant/bank-accounts" className="btn btn-solid">
          {t("addBank")}
        </Link>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const n = Number(amount);
    const next: typeof errors = {};
    if (!Number.isFinite(n) || n < 1) next.amount = t("errAmount");
    else if (n > available) next.amount = t("errMax");
    if (!bank) next.bank = t("errBank");
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await requestWithdrawal({ amount: n, bankAccountId: bank, notes });
      await Promise.all([qc.invalidateQueries({ queryKey: ["wallet"] }), qc.invalidateQueries({ queryKey: ["wallet-tx"] }), qc.invalidateQueries({ queryKey: ["withdrawals"] })]);
      onDone();
    } catch (err) {
      setFormError(apiError(err, { 400: t("insufficient") }));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field label={t("amount")} type="number" inputMode="decimal" step="any" min={1} ltr value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} hint={t("amountHint", { max: fmtNum(available) })} />
      <SelectField label={t("bank")} value={bank} onChange={(e) => setBankId(e.target.value)} error={errors.bank}>
        {list.map((b) => (
          <option key={b.id} value={b.id}>
            {b.bankName} •••• {b.accountNumber.slice(-4)}
          </option>
        ))}
      </SelectField>
      <TextAreaField label={t("notes")} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} disabled={busy} className="btn btn-line">
          {t("cancel")}
        </button>
        <button type="submit" disabled={busy} className="btn btn-solid">
          {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {busy ? t("sending") : t("submit")}
        </button>
      </div>
    </form>
  );
}

export default function WalletPage() {
  const t = useT(dict);
  const { locale } = useLocale();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);

  const wallet = useQuery({ queryKey: ["wallet"], queryFn: fetchWallet });
  const tx = useQuery({ queryKey: ["wallet-tx", page], queryFn: () => fetchTransactions(page), placeholderData: keepPreviousData });
  const wds = useQuery({ queryKey: ["withdrawals"], queryFn: fetchWithdrawals });

  const available = num(wallet.data?.availableBalance) ?? 0;

  return (
    <div className="space-y-12">
      <div>
        <PageHead
          title={t("title")}
          sub={t("sub")}
          action={
            <button type="button" onClick={() => { setRequested(false); setOpen(true); }} disabled={available < 1} className="btn btn-solid">
              {t("withdraw")}
            </button>
          }
        />
        {requested && (
          <div className="mb-6">
            <Alert tone="success">{t("requested")}</Alert>
          </div>
        )}
        <QueryState q={wallet}>
          {(w) => (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-grove bg-surface p-6">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <span className="size-2.5 rounded-sm bg-grove" aria-hidden="true" />
                  {t("available")}
                </dt>
                <dd className="mt-2 font-display text-4xl font-bold text-grove">
                  <Money value={num(w.availableBalance) ?? 0} />
                </dd>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <span className="size-2.5 rounded-sm bg-oil" aria-hidden="true" />
                  {t("pending")}
                </dt>
                <dd className="mt-2 font-display text-3xl font-bold text-oil">
                  <Money value={num(w.pendingBalance) ?? 0} />
                </dd>
                <dd className="mt-2 text-xs text-muted">{t("pendingHint")}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <dt className="text-sm text-muted">{t("total")}</dt>
                <dd className="mt-2 font-display text-3xl font-bold">
                  <Money value={num(w.totalEarned) ?? 0} />
                </dd>
              </div>
            </dl>
          )}
        </QueryState>
      </div>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">{t("wdTitle")}</h2>
        <QueryState q={wds} isEmpty={(d) => d.length === 0} empty={<p className="text-muted">{t("wdEmpty")}</p>} skeleton={<div className="h-20 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}>
          {(list) => (
            <ul className="space-y-3">
              {list.map((w) => {
                const st = norm(w.status);
                return (
                  <li key={w.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                    <Money value={num(w.amount)} className="font-display text-xl font-bold" />
                    <Badge tone={WD_TONE[st] ?? "wait"}>{st in WD_TONE ? t(st as "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED") : t("UNKNOWN")}</Badge>
                    <span className="text-sm text-muted">{fmtDate(w.createdAt, locale)}</span>
                    {w.rejectionReason && (
                      <span className="basis-full text-sm">
                        <span className="text-muted">{t("reason")}: </span>
                        {w.rejectionReason}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </QueryState>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">{t("txTitle")}</h2>
        <QueryState q={tx} isEmpty={(d) => d.items.length === 0} empty={<p className="text-muted">{t("txEmpty")}</p>} skeleton={<div className="h-40 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}>
          {(d) => (
            <>
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {d.items.map((x) => {
                  const kind = norm(x.type); // credit | debit | hold | release
                  const credit = kind === "CREDIT" || kind === "RELEASE";
                  const sign = kind === "CREDIT" || kind === "RELEASE" ? "+" : kind === "DEBIT" ? "−" : "";
                  const reason = norm(x.reason);
                  return (
                    <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="font-medium">{(REASONS as readonly string[]).includes(reason) ? t(reason as (typeof REASONS)[number]) : t("OTHER")}</p>
                        <p className="text-xs text-muted">{fmtDate(x.createdAt, locale)}</p>
                      </div>
                      <div className="text-end">
                        <p className={`figure font-bold ${credit ? "text-grove" : kind === "DEBIT" ? "text-pomegranate" : ""}`}>
                          {sign}
                          {fmtNum(num(x.amount) ?? 0)} ₪
                        </p>
                        {num(x.balanceAfter) !== null && (
                          <p className="text-xs text-muted">
                            {t("balanceAfter")}: <span className="figure">{fmtNum(num(x.balanceAfter) ?? 0)}</span>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
            </>
          )}
        </QueryState>
      </section>

      <Dialog open={open} title={t("withdrawTitle")} onClose={() => setOpen(false)} wide>
        <WithdrawForm
          available={available}
          onDone={() => {
            setOpen(false);
            setRequested(true);
          }}
        />
      </Dialog>
    </div>
  );
}

