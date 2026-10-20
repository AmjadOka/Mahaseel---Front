import { SALE_METHOD } from "@/lib/enums";
import { UNITS, type MarketQuery } from "./types";

export type SP = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 12;
export const FILTER_KEYS = ["categoryId", "saleMethod", "priceMin", "priceMax", "location", "unit"] as const;

/**
 * True when a URL value names this sale method, ignoring case. Before this, parseQuery and the
 * filter chips compared a lowercased URL value to the enum constant. If the constant was
 * uppercase, the sale-method filter silently did nothing.
 */
export const isMethod = (value: string | null | undefined, method: string) =>
  (value ?? "").toLowerCase() === String(method).toLowerCase();

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

// FilterMarketDto: priceMin / priceMax are @Min(1), page is @Min(1) @IsInt
const atLeastOne = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 1 ? n : undefined;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sanitises URL params so the backend's ValidationPipe never rejects them. */
export function parseQuery(sp: SP): MarketQuery {
  const method = one(sp.saleMethod);
  const categoryId = one(sp.categoryId);
  const unit = one(sp.unit)?.toLowerCase();
  const priceMin = atLeastOne(one(sp.priceMin));
  let priceMax = atLeastOne(one(sp.priceMax));
  if (priceMin !== undefined && priceMax !== undefined && priceMax < priceMin) priceMax = undefined;

  return {
    q: one(sp.q)?.slice(0, 100),
    categoryId: categoryId && UUID.test(categoryId) ? categoryId : undefined,
    saleMethod: isMethod(method, SALE_METHOD.FIXED)
      ? SALE_METHOD.FIXED
      : isMethod(method, SALE_METHOD.AUCTION)
        ? SALE_METHOD.AUCTION
        : undefined,
    priceMin,
    priceMax,
    location: one(sp.location)?.slice(0, 150),
    unit: unit && (UNITS as readonly string[]).includes(unit) ? unit : undefined,
    page: Math.floor(atLeastOne(one(sp.page)) ?? 1),
  };
}

const KEYS = ["q", ...FILTER_KEYS] as const;

export function buildParams(q: MarketQuery, page = q.page): URLSearchParams {
  const p = new URLSearchParams();
  for (const k of KEYS) {
    const v = q[k];
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  if (page && page > 1) p.set("page", String(page));
  return p;
}

export function marketHref(q: MarketQuery, page = 1): string {
  const s = buildParams(q, page).toString();
  return s ? `/market?${s}` : "/market";
}

export const hasFilters = (q: MarketQuery) => FILTER_KEYS.some((k) => q[k] !== undefined);
