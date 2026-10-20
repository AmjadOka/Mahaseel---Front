"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "@/features/market/list/pagination.i18n";

type Props = { page: number; totalPages: number } & (
  | { hrefFor: (page: number) => string; onPage?: never }
  | { onPage: (page: number) => void; hrefFor?: never }
);

export default function PageNav({ page, totalPages, hrefFor, onPage }: Props) {
  const t = useT(dict);
  if (totalPages <= 1) return null;
  const btn = "btn btn-line h-10 px-4";

  const go = (to: number, children: React.ReactNode) =>
    hrefFor ? (
      <Link href={hrefFor(to)} className={btn}>
        {children}
      </Link>
    ) : (
      <button type="button" onClick={() => onPage(to)} className={btn}>
        {children}
      </button>
    );

  return (
    <nav
      aria-label={t("pageOf", { page, total: totalPages })}
      className="mt-8 flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        go(
          page - 1,
          <>
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t("prev")}
          </>
        )
      ) : (
        <span />
      )}
      <span className="figure text-sm text-muted">
        {t("pageOf", { page, total: totalPages })}
      </span>
      {page < totalPages ? (
        go(
          page + 1,
          <>
            {t("next")}
            <ChevronRight
              className="size-4 rtl:rotate-180"
              aria-hidden="true"
            />
          </>
        )
      ) : (
        <span />
      )}
    </nav>
  );
}
