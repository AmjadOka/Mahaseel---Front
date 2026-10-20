import type { Order } from "./types";

export const STATUS_KEYS = ["PENDING", "AWAITING_PAYMENT", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED", "REFUNDED", "PREPARING", "IN_DELIVERY", "READY_PICKUP", "DELIVERED"] as const;
export type StatusKey = (typeof STATUS_KEYS)[number];
export type Tone = "wait" | "pay" | "go" | "done" | "stop";

/** Case/format-insensitive, so it works whether the enums are 'IN_DELIVERY', 'in_delivery' or 'in-delivery'. */
export const norm = (s: unknown) => {
  const k = String(s ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  return k === "IN_ACTIVE" ? "INACTIVE" : k; // ProductStatus.INACTIVE is spelled 'in-active' on the backend
};

const known = (s: string): s is StatusKey => (STATUS_KEYS as readonly string[]).includes(s);

/** The one label a buyer cares about: once paid, the delivery stage replaces plain "accepted". */
export function statusKey(o: Pick<Order, "status" | "deliveryStatus">): StatusKey | null {
  const s = norm(o.status);
  const d = norm(o.deliveryStatus);
  if (s === "ACCEPTED" && known(d)) return d;
  return known(s) ? s : null;
}

const TONES: Record<StatusKey, Tone> = {
  PENDING: "wait",
  AWAITING_PAYMENT: "pay",
  ACCEPTED: "go",
  PREPARING: "go",
  IN_DELIVERY: "go",
  READY_PICKUP: "go",
  DELIVERED: "go",
  COMPLETED: "done",
  REJECTED: "stop",
  CANCELLED: "stop",
  REFUNDED: "stop",
};
export const toneOf = (k: StatusKey | null): Tone => (k ? TONES[k] : "wait");

export const isStopped = (o: Pick<Order, "status">) => ["REJECTED", "CANCELLED", "REFUNDED"].includes(norm(o.status));

/** [sent, accepted, paid, delivered, receipt confirmed] */
export function progress(o: Pick<Order, "status" | "deliveryStatus">): boolean[] {
  const s = norm(o.status);
  const completed = s === "COMPLETED";
  const paid = s === "ACCEPTED" || completed;
  const accepted = paid || s === "AWAITING_PAYMENT";
  const delivered = norm(o.deliveryStatus) === "DELIVERED" || completed;
  return [true, accepted, paid, delivered, completed];
}
