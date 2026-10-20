import { isObj } from "./base";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

const toNum = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() === "" ? NaN : Number(v);
  return v === null || v === undefined || !Number.isFinite(n) ? null : n;
};

/**
 * Every object along the `{ data }` envelope chain, plus any `meta` object found on the way.
 * The API wraps responses, sometimes twice (`{ data: { data: [...], total } }`), so this walks down a few levels.
 */
function layersOf(body: unknown): Record<string, unknown>[] {
  const layers: Record<string, unknown>[] = [];
  let cur: unknown = body;
  while (isObj(cur) && !Array.isArray(cur) && layers.length < 4) {
    layers.push(cur);
    if (isObj(cur.meta)) layers.push(cur.meta);
    cur = cur.data;
  }
  return layers;
}

/**
 * Accepts `{ items, total, ... }`, `{ data: [...], total }`, `{ data: { data: [...], total } }`, `{ data: { items } }`,
 * or a bare array. Anything else degrades to an empty page instead of crashing.
 */
export function normalizePage<T>(
  body: unknown,
  page: number,
  fallbackLimit: number
): Paginated<T> {
  const layers = layersOf(body);
  const field = (key: string): unknown =>
    layers.find((l) => l[key] !== undefined && l[key] !== null)?.[key];

  const listLayer = layers.find(
    (l) => Array.isArray(l.items) || Array.isArray(l.data)
  );
  const list = listLayer?.items ?? listLayer?.data;
  const items = (
    Array.isArray(body) ? body : Array.isArray(list) ? list : []
  ) as T[];

  const total = toNum(field("total")) ?? items.length;
  const limit = toNum(field("limit")) ?? fallbackLimit;
  const current = toNum(field("page")) ?? page;
  const hasNext = field("hasNext") ?? field("hasNextPage");

  return {
    items,
    total,
    page: current,
    limit,
    totalPages:
      toNum(field("totalPages")) ?? Math.max(1, Math.ceil(total / limit)),
    hasNext: typeof hasNext === "boolean" ? hasNext : current * limit < total,
  };
}

/** Plain arrays, or `{ items }` / `{ data }` wrappers, including one level of double wrapping. */
export function asList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  for (const l of layersOf(body)) {
    if (Array.isArray(l.items)) return l.items as T[];
    if (Array.isArray(l.data)) return l.data as T[];
  }
  return [];
}
