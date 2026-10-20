"use client";

import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./order-detail.i18n";
import { progress } from "./status";
import type { Order } from "./types";

const STEPS = ["stSent", "stAccepted", "stPaid", "stDelivered", "stDone"] as const;

export default function OrderTracker({ order }: { order: Order }) {
  const t = useT(dict);
  const done = progress(order);
  const current = done.indexOf(false); // -1 once everything is done

  return (
    <ol aria-label={t("progressLabel")} className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-2">
      {STEPS.map((key, i) => {
        const state = done[i] ? "done" : i === current ? "current" : "todo";
        return (
          <li key={key} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${
                state === "done" ? "border-grove bg-grove text-on-solid" : state === "current" ? "border-grove text-grove" : "border-line text-muted"
              }`}
            >
              {state === "done" ? <Check className="size-4" aria-hidden="true" /> : <span className="figure">{i + 1}</span>}
            </span>
            <span className={`text-sm ${state === "todo" ? "text-muted" : "font-medium"}`}>{t(key)}</span>
          </li>
        );
      })}
    </ol>
  );
}
