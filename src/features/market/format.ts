import type { Locale } from "@/lib/i18n/locale";
import type { Category, CategoryOption, MediaItem, Product } from "./types";

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });

export const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const fmtNum = (n: number) => nf.format(n);

/** Case-insensitive, so it holds whatever casing the enum uses. */
export const isAuction = (p: Product) => String(p.saleMethod).toUpperCase() === "AUCTION";

export const auctionEnded = (p: Product) => isAuction(p) && !!p.auctionEndAt && new Date(p.auctionEndAt).getTime() <= Date.now();

export const isVideo = (m: MediaItem) => String(m.mediaType).toLowerCase() === "video";

export const mediaOf = (p: Product): MediaItem[] => [...(p.media ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

/** First image, else the auction cover photo. */
export const coverOf = (p: Product): string | null => mediaOf(p).find((m) => !isVideo(m))?.url ?? p.auctionImageUrl ?? null;

/** What a buyer can actually take: `availableQuantity` when the backend tracks it, else the listed quantity. */
export const availableOf = (p: Product): number => num(p.availableQuantity) ?? num(p.quantity) ?? 0;

/**
 * The name in the page's language, falling back to the other one. `||` rather than `??` so an
 * empty Arabic name falls back instead of rendering blank.
 */
export function categoryName(c: Pick<Category, "nameAr" | "nameEn"> | null | undefined, locale: Locale): string | null {
  if (!c) return null;
  const [first, second] = locale === "ar" ? [c.nameAr, c.nameEn] : [c.nameEn, c.nameAr];
  return first || second || null;
}

export function flattenCategories(list: Category[], locale: Locale, depth = 0): CategoryOption[] {
  return list.flatMap((c) => [
    { id: c.id, label: `${"— ".repeat(depth)}${categoryName(c, locale) ?? c.id}` },
    ...flattenCategories(c.children ?? [], locale, depth + 1),
  ]);
}
