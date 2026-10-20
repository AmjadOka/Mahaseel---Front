import { apiPost } from "@/lib/api/client";

/** CreateOrderDto: `offeredPrice` is the TOTAL the buyer offers for the whole order (min 1); `notes` is optional. */
export const placeOrder = (o: { productId: string; quantity: number; offeredPrice: number; notes?: string }) =>
  apiPost("/orders", { ...o, notes: o.notes?.trim() || undefined });

// Bid body is still a guess (the auctions DTO wasn't shared) — adjust here.
export const placeBid = (productId: string, amount: number) => apiPost("/auctions/bids", { productId, amount });
