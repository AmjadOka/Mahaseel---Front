import type { Product } from "@/features/market/types";

export interface Payment {
  status?: string;
  gatewayUrl?: string | null;
  amount?: number | string;
}

/** Fields the order endpoints return (OrdersService). Enum casing is normalised in status.ts. */
export interface Order {
  id: string;
  productId?: string;
  merchantId?: string;
  buyerId?: string;
  buyer?: { fullName?: string | null; email?: string | null } | null;
  saleMethod?: string;
  offeredPrice?: number | string;
  finalPrice: number | string;
  quantity: number | string;
  unit: string;
  status: string;
  deliveryStatus?: string | null;
  deliveryMethod?: string;
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  product?: Product | null;
  payment?: Payment | null;
}
