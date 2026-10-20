import { apiGet, apiPut } from "@/lib/api/client";
import { normalizePage } from "@/lib/api/paginate";
import { norm } from "@/features/orders/status";
import type { Order } from "@/features/orders/types";

export const MERCHANT_ORDERS_PAGE_SIZE = 10;

export const fetchIncoming = async (page: number) =>
  normalizePage<Order>(await apiGet<unknown>("/orders/incoming", { page, limit: MERCHANT_ORDERS_PAGE_SIZE }), page, MERCHANT_ORDERS_PAGE_SIZE);

export const acceptOrder = (id: string) => apiPut(`/orders/${id}/accept`);
/** RejectOrderDto: reason (required, ≤ 500). */
export const rejectOrder = (id: string, reason: string) => apiPut(`/orders/${id}/reject`, { reason });
/** UpdateOrderStatusDto: status = DeliveryStatus. */
export const updateDelivery = (id: string, status: string) => apiPut(`/orders/${id}/status`, { status });

export type DeliveryStep = "IN_DELIVERY" | "READY_PICKUP" | "DELIVERED";

/** Mirrors OrdersService.updateDeliveryStatus: farm pickup goes PREPARING → DELIVERED; driver orders go via IN_DELIVERY / READY_PICKUP. */
export function nextDeliverySteps(o: Pick<Order, "deliveryStatus" | "deliveryMethod">): DeliveryStep[] {
  const d = norm(o.deliveryStatus);
  const driver = norm(o.deliveryMethod) === "DRIVER";
  if (d === "PREPARING") return driver ? ["IN_DELIVERY", "READY_PICKUP"] : ["DELIVERED"];
  if ((d === "IN_DELIVERY" || d === "READY_PICKUP") && driver) return ["DELIVERED"];
  return [];
}
