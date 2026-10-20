"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Sprout } from "lucide-react";
import Alert from "@/components/Alert";
import Money from "@/components/Money";
import PageNav from "@/components/page-nav/PageNav";
import { cld } from "@/lib/cloudinary";
import { ApiError } from "@/lib/api/base";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import { coverOf, fmtNum, num } from "@/features/market/format";
import unitsDict, { unitLabel } from "@/features/market/units.i18n";
import dict from "./orders.i18n";
import { fetchMyOrders } from "./orders-api";
import StatusBadge from "./StatusBadge";

function Skeleton() {
  return (
    <ul
      className="mt-8 animate-pulse space-y-3 motion-reduce:animate-none"
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-28 rounded-2xl border border-line bg-surface"
        />
      ))}
    </ul>
  );
}

function OrdersListBody() {
  const ready = useRequireAuth();
  const t = useT(dict);
  const tu = useT(unitsDict);
  const { locale } = useLocale();
  const page = Math.max(
    1,
    Math.floor(Number(useSearchParams().get("page"))) || 1
  );

  const q = useQuery({
    queryKey: ["orders", page],
    queryFn: () => fetchMyOrders(page),
    enabled: ready,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="font-display text-4xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      {!ready || q.isPending ? (
        <Skeleton />
      ) : q.isError ? (
        <div className="mt-8 space-y-4">
          <Alert tone="error">
            {q.error instanceof ApiError && q.error.status === 403
              ? t("buyersOnly")
              : t("loadError")}
          </Alert>
          <button
            type="button"
            onClick={() => q.refetch()}
            className="btn btn-line"
          >
            {t("retry")}
          </button>
        </div>
      ) : q.data.items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
          <Sprout className="size-11 text-grove/40" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-bold">{t("empty")}</h2>
          <p className="mt-1 max-w-sm text-muted">{t("emptyHint")}</p>
          <Link href="/market" className="btn btn-solid mt-6">
            {t("browse")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-3">
            {q.data.items.map((o) => {
              const img = o.product ? coverOf(o.product) : null;
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-grove"
                  >
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-grove-soft sm:size-24">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
                        <img
                          src={cld(img, 200)}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-grove/40">
                          <Sprout className="size-7" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="line-clamp-1 font-display text-lg font-bold">
                          {o.product?.name ?? t("deletedProduct")}
                        </h2>
                        <StatusBadge order={o} />
                      </div>
                      <p className="text-sm text-muted">
                        <span className="figure">
                          {fmtNum(num(o.quantity) ?? 0)}
                        </span>{" "}
                        {unitLabel(tu, o.unit)} ·{" "}
                        {t("placedOn", { date: fmtDate(o.createdAt, locale) })}
                      </p>
                      <Money
                        value={num(o.finalPrice)}
                        className="text-lg font-bold text-grove"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <PageNav
            page={q.data.page}
            totalPages={q.data.totalPages}
            hrefFor={(n) => (n > 1 ? `/orders?page=${n}` : "/orders")}
          />
        </>
      )}
    </div>
  );
}

export default withSuspense(OrdersListBody);
