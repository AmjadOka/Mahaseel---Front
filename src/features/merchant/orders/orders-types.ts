// Save as features/orders/types.ts. Replaces the uploaded orders types file.
import type { Product } from "@/features/market/types";

export interface Payment {
  status?: string;
  gatewayUrl?: string | null;
  amount?: number | string | null;
}

/**
 * Order as the order endpoints return it. finalPrice is null until the merchant accepts,
 * and deliveryStatus is null before acceptance. The buyer's phone appears only after
 * acceptance, and only in the merchant's view. Enum casing is normalised in status.ts.
 */
export interface Order {
  id: string;
  productId?: string;
  merchantId?: string;
  buyerId?: string;
  buyer?: { fullName?: string | null; email?: string | null; phone?: string | null } | null;
  buyerPhoneRevealed?: boolean;
  saleMethod?: string;
  offeredPrice?: number | string | null;
  finalPrice?: number | string | null;
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
