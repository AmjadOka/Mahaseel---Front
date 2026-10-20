"use client";

import { useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { CategoryOption } from "../types";
import dict from "./filters.i18n";
import FiltersPanel from "./FiltersForm";

/** Mobile bottom sheet on a native <dialog>: focus trap, Esc to close and inert background come built in. */
export default function FiltersDrawer({ categories }: { categories: CategoryOption[] }) {
  const t = useT(dict);
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => ref.current?.showModal()} className="btn btn-line h-12">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {t("filters")}
      </button>

      <dialog
        ref={ref}
        aria-label={t("filters")}
        onClick={(e) => e.target === ref.current && ref.current?.close()} // a click on the backdrop lands on the dialog itself
        className="m-0 mt-auto mb-0 max-h-[88dvh] w-full max-w-full overflow-y-auto rounded-t-3xl border-t border-line bg-paper p-0 text-ink backdrop:bg-black/50"
      >
        <div className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{t("filters")}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={t("close")} className="grid size-9 place-items-center rounded-full border border-line">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <FiltersPanel categories={categories} onDone={() => ref.current?.close()} />
        </div>
      </dialog>
    </div>
  );
}
