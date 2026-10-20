import { asList } from "@/lib/api/paginate";
import type { Category } from "./types";

/**
 * `GET /categories` returns only top-level categories, paginated (parentId defaults to null),
 * so children are fetched per parent. Two levels is what the UI shows today.
 */
export async function loadCategoryTree(get: (path: string) => Promise<unknown>, opts: { activeOnly?: boolean } = {}): Promise<Category[]> {
  const activeOnly = opts.activeOnly ?? true; // admins also need the inactive ones
  const page = async (q: string) => asList<Category>(await get(`/categories?${q}&limit=50${activeOnly ? "&isActive=true" : ""}`));
  const roots = await page("page=1");
  await Promise.all(
    roots.map(async (r) => {
      r.children = await page(`parentId=${r.id}`).catch(() => []);
    }),
  );
  return roots;
}
