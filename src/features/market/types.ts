export { SALE_METHOD } from "@/lib/enums";
import type { SALE_METHOD } from "@/lib/enums";
export type SaleMethod = (typeof SALE_METHOD)[keyof typeof SALE_METHOD];

/** Backend `Unit` enum (lowercase values). */
export const UNITS = ["kg", "ton", "head", "box", "piece"] as const;

export interface MediaItem {
  id: string;
  url: string;
  mediaType: string;
  sortOrder?: number;
}

export interface Farm {
  id?: string;
  name?: string | null;
  locationText?: string | null;
}

export interface Category {
  id: string;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  slug?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number | null;
  parentId?: string | null;
  children?: Category[];
}

export interface Product {
  id: string;
  merchantId?: string;
  name: string;
  description?: string | null;
  quantity: number | string;
  availableQuantity?: number | string | null; // no DecimalTransformer on the backend → arrives as a string
  unit: string;
  saleMethod: string;
  fixedPrice?: number | string | null;
  auctionStartPrice?: number | string | null;
  currentBid?: number | string | null;
  auctionEndAt?: string | null;
  auctionImageUrl?: string | null;
  deliveryMethod?: string | null;
  status?: string;
  media?: MediaItem[];
  category?: Category | null;
  farm?: Farm | null;
}

export type { Paginated } from "@/lib/api/paginate";

/** Mirrors FilterMarketDto — only these keys are ever sent to the API. */
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
