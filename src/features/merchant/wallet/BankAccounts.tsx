"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Dialog from "@/components/dialog/Dialog";
import Field from "@/components/field/Field";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createBankAccount, deleteBankAccount, fetchBankAccounts, setDefaultBankAccount, updateBankAccount, type BankAccount, type BankInput } from "./bank-api";
import dict from "./bank.i18n";
import { isValidIban, normalizeIban } from "./iban";

const NUMBER = /^[0-9A-Za-z-]{5,50}$/;

function BankForm({ account, onDone }: { account: BankAccount | null; onDone: () => void }) {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [v, setV] = useState({ bankName: account?.bankName ?? "", accountHolderName: account?.accountHolderName ?? "", accountNumber: account?.accountNumber ?? "", iban: account?.iban ?? "", branchName: account?.branchName ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (v.bankName.trim().length < 2) next.bankName = t("errName");
    if (v.accountHolderName.trim().length < 2) next.accountHolderName = t("errName");
    if (!NUMBER.test(v.accountNumber.trim())) next.accountNumber = t("errNumber");
    const iban = normalizeIban(v.iban);
    if (iban && !isValidIban(iban)) next.iban = t("errIban");
    if (v.branchName.trim() && v.branchName.trim().length < 2) next.branchName = t("errName");
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    const body: BankInput = {
      bankName: v.bankName.trim(),
      accountHolderName: v.accountHolderName.trim(),
      accountNumber: v.accountNumber.trim(),
      iban: iban || undefined,
      branchName: v.branchName.trim() || undefined,
    };
    setBusy(true);
    try {
      if (account) await updateBankAccount(account.id, body);
      else await createBankAccount(body);
      await qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      onDone();
    } catch (err) {
      // 409: this account number is already saved. A 400 is a validation problem and gets
      // the generic message.
      setFormError(apiError(err, { 409: t("duplicate") }));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field label={t("bankName")} value={v.bankName} onChange={set("bankName")} error={errors.bankName} maxLength={100} />
      <Field label={t("accountHolderName")} value={v.accountHolderName} onChange={set("accountHolderName")} error={errors.accountHolderName} maxLength={150} />
      <Field label={t("accountNumber")} ltr value={v.accountNumber} onChange={set("accountNumber")} error={errors.accountNumber} hint={t("accountNumberHint")} maxLength={50} />
      <Field label={t("iban")} ltr value={v.iban} onChange={set("iban")} error={errors.iban} maxLength={40} />
      <Field label={t("branchName")} value={v.branchName} onChange={set("branchName")} error={errors.branchName} maxLength={150} />
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} disabled={busy} className="btn btn-line">
          {t("cancel")}
        </button>
        <button type="submit" disabled={busy} className="btn btn-solid">
          {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {busy ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}

export default function BankAccounts() {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BankAccount | "new" | null>(null);
  const [removing, setRemoving] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["bank-accounts"], queryFn: fetchBankAccounts });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["bank-accounts"] });
    setError(null);
  };
  const failed = (e: unknown) => {
    setRemoving(null);
    setError(apiError(e, { 400: t("failed"), 404: t("failed") }));
  };
  const makeDefault = useMutation({ mutationFn: (id: string) => setDefaultBankAccount(id), onSuccess: refresh, onError: failed });
  const remove = useMutation({ mutationFn: (id: string) => deleteBankAccount(id), onSuccess: () => { setRemoving(null); refresh(); }, onError: failed });

  const add = (
    <button type="button" onClick={() => setEditing("new")} className="btn btn-solid">
      {t("add")}
    </button>
  );

  return (
    <div>
      <PageHead title={t("title")} sub={t("sub")} action={add} />
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <QueryState q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={Landmark} title={t("empty")} hint={t("emptyHint")} action={add} />}>
        {(accounts) => (
          <ul className="grid gap-4 sm:grid-cols-2">
            {accounts.map((a) => (
              <li key={a.id} className={`flex flex-col gap-3 rounded-2xl border bg-surface p-5 ${a.isDefault ? "border-grove" : "border-line"}`}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{a.bankName}</h2>
                  {a.isDefault && <Badge tone="go">{t("default")}</Badge>}
                </div>
                <p className="figure text-lg tracking-wide">•••• {a.accountNumber.slice(-4)}</p>
                <p className="text-sm text-muted">
                  {t("holder")}: {a.accountHolderName}
                  {a.branchName ? ` · ${t("branch")}: ${a.branchName}` : ""}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {!a.isDefault && (
                    <button type="button" disabled={makeDefault.isPending} onClick={() => makeDefault.mutate(a.id)} className="btn btn-line h-10 px-4">
                      {t("setDefault")}
                    </button>
                  )}
                  <button type="button" onClick={() => setEditing(a)} className="btn btn-line h-10 px-4">
                    {t("edit")}
                  </button>
                  <button type="button" onClick={() => setRemoving(a)} className="btn btn-line h-10 px-4 text-pomegranate">
                    {t("remove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <Dialog open={editing !== null} title={editing && editing !== "new" ? t("editTitle") : t("addTitle")} onClose={() => setEditing(null)} wide>
        {/* The key resets the form when the target changes. Without it, the fields keep the previous account's values. */}
        <BankForm key={editing === "new" || !editing ? "new" : editing.id} account={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      </Dialog>
      <ConfirmDialog
        open={!!removing}
        title={t("removeTitle")}
        body={t("removeBody")}
        confirmLabel={t("removeYes")}
        cancelLabel={t("keep")}
        danger
        busy={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
        onClose={() => !remove.isPending && setRemoving(null)}
      />
    </div>
  );
}
