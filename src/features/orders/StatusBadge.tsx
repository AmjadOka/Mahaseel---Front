"use client";

import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./order-status.i18n";
import { statusKey, toneOf, type Tone } from "./status";
import type { Order } from "./types";

const DOT: Record<Tone, string> = { wait: "bg-oil", pay: "bg-pomegranate", go: "bg-grove", done: "bg-grove", stop: "bg-muted" };

export default function StatusBadge({ order }: { order: Pick<Order, "status" | "deliveryStatus"> }) {
  const t = useT(dict);
  const key = statusKey(order);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium">
      <span className={`size-2 rounded-full ${DOT[toneOf(key)]}`} aria-hidden="true" />
      {t(key ?? "UNKNOWN")}
    </span>
  );
}
