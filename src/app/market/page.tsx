import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sprout } from "lucide-react";
import { getServerLocale, getT } from "@/lib/i18n/server";
import { getCategories, getMarket } from "@/features/market/api";
import { flattenCategories } from "@/features/market/format";
import {
  buildParams,
  hasFilters,
  marketHref,
  parseQuery,
  type SP,
} from "@/features/market/query";
import type { MarketQuery } from "@/features/market/types";
import ActiveFilters from "@/features/market/filters/ActiveFilters";
import FiltersDrawer from "@/features/market/filters/FiltersDrawer";
import FiltersPanel from "@/features/market/filters/FiltersForm";
import SearchBar from "@/features/market/filters/SearchBar";
import GridSkeleton from "@/features/market/list/GridSkeleton";
import dict from "@/features/market/list/market.i18n";
import Pagination from "@/features/market/list/Pagination";
import ProductCard from "@/features/market/list/ProductCard";

export async function generateMetadata() {
  const t = await getT(dict);
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const query = parseQuery(await searchParams);
  const [t, locale, tree] = await Promise.all([
    getT(dict),
    getServerLocale(),
    getCategories(),
  ]);
  const categories = flattenCategories(tree, locale);

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="font-display text-4xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      <div className="mt-6 flex gap-3">
        <SearchBar />
        <FiltersDrawer categories={categories} />
      </div>
      <ActiveFilters categories={categories} />

      <div className="mt-8 lg:flex lg:items-start lg:gap-10">
        <aside className="hidden w-72 shrink-0 lg:sticky lg:top-24 lg:block">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <FiltersPanel categories={categories} />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <Suspense
            key={buildParams(query).toString()}
            fallback={<GridSkeleton />}
          >
            <Results query={query} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function Results({ query }: { query: MarketQuery }) {
  const [t, data] = await Promise.all([getT(dict), getMarket(query)]);

  // A page number past the end (stale link) goes back to page 1.
  if (!data.items.length && data.total > 0 && (query.page ?? 1) > 1)
    redirect(marketHref(query, 1));

  if (!data.items.length) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
        <Sprout className="size-11 text-grove/40" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-bold">
          {t("noResults")}
        </h2>
        <p className="mt-1 max-w-sm text-muted">{t("noResultsHint")}</p>
        {hasFilters(query) && (
          <Link
            href={marketHref({ q: query.q })}
            className="btn btn-solid mt-6"
          >
            {t("reset")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        {data.total === 1 ? t("resultsOne") : t("results", { n: data.total })}
      </p>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {data.items.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        hrefFor={(n) => marketHref(query, n)}
      />
    </>
  );
}
