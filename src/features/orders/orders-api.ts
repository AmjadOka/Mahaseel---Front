import { ApiError, isObj } from "@/lib/api/base";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { normalizePage } from "@/lib/api/paginate";
import type { Order } from "./types";

export const ORDERS_PAGE_SIZE = 10;

const unwrap = <T,>(r: unknown): T => (isObj(r) && isObj(r.data) && !("id" in r) ? r.data : r) as T;

export const fetchMyOrders = async (page: number) =>
  normalizePage<Order>(await apiGet<unknown>("/orders/my", { page, limit: ORDERS_PAGE_SIZE }), page, ORDERS_PAGE_SIZE);

export const fetchOrder = async (id: string) => unwrap<Order>(await apiGet<unknown>(`/orders/${id}`));

export const cancelOrder = async (id: string) => unwrap<Order>(await apiDelete<unknown>(`/orders/${id}/cancel`));

export const confirmReceipt = async (id: string) => unwrap<Order>(await apiPut<unknown>(`/orders/${id}/confirm`));

/** Fallback when the order doesn't already carry its Stripe link (`order.payment.gatewayUrl`). */
export async function startPayment(id: string): Promise<string> {
  const res = unwrap<{ paymentUrl?: string }>(await apiPost<unknown>(`/payments/orders/${id}/initiate`));
  if (!res.paymentUrl) throw new ApiError(500, "No payment URL returned");
  return res.paymentUrl;
}
