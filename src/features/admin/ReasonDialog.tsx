"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Dialog from "@/components/dialog/Dialog";
import { TextAreaField } from "@/components/field/Fields";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./admin.i18n";

type Props = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  /** 0 = the note is optional */
  minLength?: number;
  danger?: boolean;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

function Form({
  body,
  confirmLabel,
  minLength = 0,
  danger,
  busy,
  onConfirm,
  onClose,
}: Omit<Props, "open" | "title">) {
  const t = useT(dict);
  const [reason, setReason] = useState("");
  const ok = reason.trim().length >= minLength;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ok && !busy) onConfirm(reason.trim());
      }}
      className="space-y-4"
    >
      {body && <p className="text-muted">{body}</p>}
      <TextAreaField
        label={minLength ? t("reason") : t("optionalNote")}
        hint={minLength ? t("reasonHint", { n: minLength }) : undefined}
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="btn btn-line"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!ok || busy}
          className={`btn ${
            danger
              ? "bg-pomegranate text-on-solid hover:opacity-90"
              : "btn-solid"
          }`}
        >
          {busy && (
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {confirmLabel}
        </button>
      </div>
    </form>
  );
}

export default function ReasonDialog({
  open,
  title,
  onClose,
  busy,
  ...rest
}: Props) {
  return (
    <Dialog open={open} title={title} onClose={onClose} busy={busy}>
      {/* Dialog already renders its children only while open, so this guard is redundant. It stays as
          a safeguard: the reason box starts empty each time the dialog opens. */}
      {open && <Form {...rest} busy={busy} onClose={onClose} />}
    </Dialog>
  );
}
