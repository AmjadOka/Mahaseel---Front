// Place at src/features/market/types.ts. This replaces the uploaded file, which is the
// market types three times over. Farm and Order types live in their own files.

export { SALE_METHOD } from "@/lib/enums";
import type { SALE_METHOD } from "@/lib/enums";
export type SaleMethod = (typeof SALE_METHOD)[keyof typeof SALE_METHOD];

/** Backend Unit enum (lowercase values). */
export const UNITS = ["kg", "ton", "head", "box", "piece"] as const;

export interface MediaItem {
  id: string;
  url: string;
  mediaType: string;
  sortOrder?: number;
}

/** Public product views include only { id, name, locationText }. */
export interface Farm {
  id?: string;
  name?: string | null;
  locationText?: string | null;
}

/**
 * Category as the API returns it. There is no `name` field: the backend has nameAr and
 * nameEn only. Use the language the page is in.
 */
export interface Category {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
  slug?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number | null;
  parentId?: string | null;
  children?: Category[];
}

/**
 * Decimal columns come back as numbers (DecimalTransformer on the backend). A value is
 * null when the column is nullable and empty.
 */
export interface Product {
  id: string;
  merchantId?: string;
  name: string;
  description?: string | null;
  /** Merchant view only. Public views omit it: show availableQuantity to buyers. */
  quantity?: number;
  /** What buyers can still order. Public and merchant views both include it. */
  availableQuantity?: number | null;
  unit: string;
  saleMethod: string;
  fixedPrice?: number | null;
  auctionStartPrice?: number | null;
  currentBid?: number | null;
  auctionEndAt?: string | null;
  auctionImageUrl?: string | null;
  deliveryMethod?: string | null;
  status?: string;
  media?: MediaItem[];
  category?: Pick<Category, "id" | "nameAr" | "nameEn"> | null;
  farm?: Farm | null;
}

export type { Paginated } from "@/lib/api/paginate";

/** Mirrors FilterMarketDto. Only these keys are sent to the API. */
export interface MarketQuery {
  q?: string;
  categoryId?: string;
  saleMethod?: SaleMethod;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  unit?: string;
  page?: number;
}

export interface CategoryOption {
  id: string;
  label: string;
}
