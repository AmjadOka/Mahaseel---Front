"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import Dialog from "@/components/dialog/Dialog";

type Props = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  confirmDisabled?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export default function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, busy, confirmDisabled, danger, onConfirm, onClose, children }: Props) {
  return (
    <Dialog open={open} title={title} onClose={onClose} busy={busy}>
      {body && <p className="text-muted">{body}</p>}
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className="btn btn-line">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={busy || confirmDisabled} className={`btn ${danger ? "bg-pomegranate text-on-solid hover:opacity-90" : "btn-solid"}`}>
          {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
