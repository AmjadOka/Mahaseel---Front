import { isObj } from "@/lib/api/base";
import { apiDelete, apiForm, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { asList } from "@/lib/api/paginate";
import type { Product } from "@/features/market/types";

const unwrap = <T,>(r: unknown): T => (isObj(r) && isObj(r.data) && !("id" in r) ? r.data : r) as T;

const HOUR_MS = 3_600_000;
const MAX_AUCTION_HOURS = 720; // the server's limit: 30 days

/** GET /products returns the merchant's whole list as a plain array (not paginated). */
export const fetchMyProducts = async () => asList<Product>(await apiGet<unknown>("/products"));
export const fetchMyProduct = async (id: string) => unwrap<Product>(await apiGet<unknown>(`/products/${id}`));

/**
 * Fields accepted on create. The server requires farmId, saleMethod and deliveryMethod,
 * and a create without them is rejected.
 */
export type ProductCreate = {
  farmId: string;
  saleMethod: string;
  categoryId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  fixedPrice?: number;
  auctionStartPrice?: number;
  /** ISO time. The duration sent to the server is derived from this. */
  auctionEndAt?: string;
  deliveryMethod: string;
  driverName?: string;
  driverPhone?: string;
};

/**
 * Fields accepted on update. UpdateProductDto leaves out farmId and saleMethod, and an
 * unknown field is a 400, so the type doesn't include them.
 */
export type ProductUpdate = Partial<Omit<ProductCreate, "farmId" | "saleMethod">>;

/** Kept so existing imports of ProductInput still compile. It's the create shape. */
export type ProductInput = ProductCreate;

/**
 * Turns an auction end time into what the server stores. The server keeps the end
 * time as given, so the duration is computed from it and the two can't disagree.
 */
export function auctionTiming(endIso: string, now = Date.now()) {
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(end)) throw new Error("Invalid auction end time.");
  const hours = Math.max(1, Math.ceil((end - now) / HOUR_MS));
  if (hours > MAX_AUCTION_HOURS) throw new Error("Auctions can run for at most 30 days.");
  return { auctionEndAt: new Date(end).toISOString(), auctionDurationHours: hours };
}

/** Adds the derived duration whenever an end time is present. */
const withTiming = <T extends { auctionEndAt?: string }>(b: T) =>
  b.auctionEndAt ? { ...b, ...auctionTiming(b.auctionEndAt) } : b;

export const createProduct = async (b: ProductCreate) =>
  unwrap<Product>(await apiPost<unknown>("/products", withTiming(b)));

export const updateProduct = async (id: string, b: ProductUpdate) => {
  // Stripped here too: a stale form value can't reach the server and cause a 400.
  const { farmId: _farm, saleMethod: _sale, ...safe } = b as ProductCreate;
  return unwrap<Product>(await apiPatch<unknown>(`/products/${id}`, withTiming(safe)));
};

export const deleteProduct = (id: string) => apiDelete(`/products/${id}`);

/**
 * Puts a sold or expired product back on sale. A fixed-price product that sold out to
 * zero needs a new quantity. Auctions restart on their stored duration.
 */
export const relistProduct = (id: string, quantity?: number) =>
  apiPatch(`/products/${id}/relist`, quantity !== undefined ? { quantity } : undefined);

export const uploadProductMedia = (id: string, files: File[]) => {
  const f = new FormData();
  files.forEach((file) => f.append("files", file));
  return apiForm("PATCH", `/products/${id}/media`, f);
};
export const deleteProductMedia = (id: string, mediaId: string) => apiDelete(`/products/${id}/media/${mediaId}`);

/** AuctionMerchantController: PUT/DELETE /auctions/merchant/:productId/image (multipart, one file). */
export const uploadAuctionImage = (id: string, file: File) => {
  const f = new FormData();
  f.append("file", file);
  return apiForm("PUT", `/auctions/merchant/${id}/image`, f);
};
export const deleteAuctionImage = (id: string) => apiDelete(`/auctions/merchant/${id}/image`);
