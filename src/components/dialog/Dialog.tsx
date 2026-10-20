"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/** Native <dialog>: focus trap, Esc and inert background for free. Children mount only while open (fresh state each time). */
export default function Dialog({ open, title, onClose, busy, wide, children }: { open: boolean; title: string; onClose: () => void; busy?: boolean; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && !busy && onClose()}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${wide ? "max-w-lg" : "max-w-md"} overflow-y-auto rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-black/50`}
    >
      {open && (
        <div className="p-6">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {title}
          </h2>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
