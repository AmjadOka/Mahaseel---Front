"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import { useT } from "@/lib/i18n/LocaleProvider";
import { norm } from "@/features/orders/status";
import adminDict from "../admin.i18n";
import { adminMutate } from "../admin-api";
import ReasonDialog from "../ReasonDialog";
import dict from "./farms.i18n";

type Dlg = "approve" | "reject" | "suspend" | "unsuspend" | "delete" | null;

/** The moderation buttons (and their dialogs) for one farm. `run` is useAdminAction().run. */
export default function FarmActions({
  id,
  status,
  run,
  busy,
  onDeleted,
  compact,
}: {
  id: string;
  status?: string;
  run: (fn: () => Promise<unknown>) => Promise<boolean>;
  busy: boolean;
  onDeleted?: () => void;
  compact?: boolean;
}) {
  const t = useT(dict);
  const ta = useT(adminDict);
  const [dlg, setDlg] = useState<Dlg>(null);
  const s = norm(status);
  const btn = `btn btn-line ${compact ? "h-8 px-3 text-xs" : "h-10 px-4"}`;
  const go = async (fn: () => Promise<unknown>, after?: () => void) => {
    if (await run(fn)) {
      setDlg(null);
      after?.();
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {s === "PENDING" && (
          <>
            <button type="button" onClick={() => setDlg("approve")} className={`${btn} !border-grove text-grove`}>
              {t("approve")}
            </button>
            <button type="button" onClick={() => setDlg("reject")} className={`${btn} text-pomegranate`}>
              {t("reject")}
            </button>
          </>
        )}
        {s === "APPROVED" && (
          <button type="button" onClick={() => setDlg("suspend")} className={`${btn} text-pomegranate`}>
            {t("suspend")}
          </button>
        )}
        {s === "SUSPENDED" && (
          <button type="button" onClick={() => setDlg("unsuspend")} className={btn}>
            {t("unsuspend")}
          </button>
        )}
        {onDeleted && (
          <button type="button" onClick={() => setDlg("delete")} className={`${btn} text-pomegranate`}>
            {t("delete")}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={dlg === "approve"}
        title={t("approveTitle")}
        body={t("approveBody")}
        confirmLabel={t("approve")}
        cancelLabel={ta("cancel")}
        busy={busy}
        onConfirm={() => void go(() => adminMutate("PUT", `/farms/${id}/approve`))}
        onClose={() => !busy && setDlg(null)}
      />
      <ConfirmDialog
        open={dlg === "unsuspend"}
        title={t("unsuspendTitle")}
        body={t("unsuspendBody")}
        confirmLabel={t("unsuspend")}
        cancelLabel={ta("cancel")}
        busy={busy}
        onConfirm={() => void go(() => adminMutate("PUT", `/farms/${id}/unsuspend`))}
        onClose={() => !busy && setDlg(null)}
      />
      <ConfirmDialog
        open={dlg === "delete"}
        title={t("deleteTitle")}
        body={t("deleteBody")}
        confirmLabel={t("delete")}
        cancelLabel={ta("cancel")}
        danger
        busy={busy}
        onConfirm={() => void go(() => adminMutate("DELETE", `/farms/${id}`), onDeleted)}
        onClose={() => !busy && setDlg(null)}
      />
      <ReasonDialog
        open={dlg === "reject"}
        title={t("rejectTitle")}
        body={t("rejectBody")}
        confirmLabel={t("rejectConfirm")}
        minLength={5}
        danger
        busy={busy}
        onConfirm={(reason) => void go(() => adminMutate("PUT", `/farms/${id}/reject`, { reason }))}
        onClose={() => !busy && setDlg(null)}
      />
      <ReasonDialog
        open={dlg === "suspend"}
        title={t("suspendTitle")}
        body={t("suspendBody")}
        confirmLabel={t("suspendConfirm")}
        minLength={5}
        danger
        busy={busy}
        onConfirm={(reason) => void go(() => adminMutate("PUT", `/farms/${id}/suspend`, { reason }))}
        onClose={() => !busy && setDlg(null)}
      />
    </>
  );
}
