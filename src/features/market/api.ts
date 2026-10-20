import "server-only";
import { isObj } from "@/lib/api/base";
import { normalizePage } from "@/lib/api/paginate";
import { serverGet } from "@/lib/api/server";
import { loadCategoryTree } from "./categories";
import { PAGE_SIZE, buildParams } from "./query";
import type { Category, MarketQuery, Paginated, Product } from "./types";

export async function getMarket(q: MarketQuery): Promise<Paginated<Product>> {
  const params = buildParams(q);
  params.set("limit", String(PAGE_SIZE));
  return normalizePage<Product>(await serverGet(`/market?${params}`, { revalidate: 30 }), q.page ?? 1, PAGE_SIZE);
}

/** Never cached on our side: auction prices move. (The backend still caches detail for 10 min.) */
export async function getProduct(id: string): Promise<Product> {
  const body = await serverGet(`/market/${encodeURIComponent(id)}`);
  return (isObj(body) && isObj(body.data) && !("id" in body) ? body.data : body) as Product;
}

/** Never throws — the category filter just hides if the request fails. */
export async function getCategories(): Promise<Category[]> {
  try {
    return await loadCategoryTree((path) => serverGet(path, { revalidate: 300 }));
  } catch {
    return [];
  }
}
