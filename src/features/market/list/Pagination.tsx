import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import dict from "./pagination.i18n";

function windowed(page: number, total: number): (number | "…")[] {
  const nums = [...new Set([1, total, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const cell = "grid h-10 min-w-10 place-items-center gap-1 rounded-full px-3 text-sm transition-colors";

export default async function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const t = await getT(dict);
  const edge = "flex items-center border border-line";

  return (
    <nav aria-label={t("pageOf", { page, total: totalPages })} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${cell} ${edge} hover:border-grove`}>
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("prev")}
        </Link>
      ) : (
        <span className={`${cell} ${edge} text-muted/50`}>
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("prev")}
        </span>
      )}

      {windowed(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${cell} figure ${n === page ? "bg-grove font-medium text-on-solid" : "hover:bg-grove-soft"}`}
          >
            {n}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={`${cell} ${edge} hover:border-grove`}>
          {t("next")}
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      ) : (
        <span className={`${cell} ${edge} text-muted/50`}>
          {t("next")}
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
