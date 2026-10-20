"use client";

import Badge, { type Tone } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
import { norm } from "@/features/orders/status";
import dict from "./farms.i18n";

const TONE: Record<string, Tone> = { PENDING: "wait", APPROVED: "go", REJECTED: "stop", SUSPENDED: "pay" };

export default function FarmStatusBadge({ status }: { status?: string }) {
  const t = useT(dict);
  const k = norm(status);
  return <Badge tone={TONE[k] ?? "wait"}>{k in TONE ? t(k as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED") : t("UNKNOWN")}</Badge>;
}
