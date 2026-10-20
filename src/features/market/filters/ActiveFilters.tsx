"use client";

import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { SALE_METHOD } from "@/lib/enums";
import type { CategoryOption } from "../types";
import unitsDict, { unitLabel } from "../units.i18n";
import { isMethod } from "../query";
import dict from "./filters.i18n";
import { useMarketNav } from "./useMarketNav";

/** The filters in force, each removable, so the mobile sheet's choices stay visible. */
function ActiveFiltersBody({ categories }: { categories: CategoryOption[] }) {
  const t = useT(dict);
  const tu = useT(unitsDict);
  const sp = useSearchParams();
  const update = useMarketNav();

  const sale = sp.get("saleMethod");
  const catId = sp.get("categoryId");
  const cat = categories.find((c) => c.id === catId);
  const min = sp.get("priceMin");
  const max = sp.get("priceMax");
  const unit = sp.get("unit");
  const location = sp.get("location");

  const chips: {
    id: string;
    text: string;
    clear: Record<string, undefined>;
  }[] = [];
  if (isMethod(sale, SALE_METHOD.FIXED) || isMethod(sale, SALE_METHOD.AUCTION))
    chips.push({
      id: "m",
      text: isMethod(sale, SALE_METHOD.FIXED) ? t("fixed") : t("auction"),
      clear: { saleMethod: undefined },
    });
  // A category outside the loaded list still filters the results. Showing a chip keeps that filter
  // visible and removable.
  if (cat)
    chips.push({
      id: "c",
      text: cat.label.replace(/^(— )+/, ""),
      clear: { categoryId: undefined },
    });
  else if (catId)
    chips.push({
      id: "c",
      text: t("category"),
      clear: { categoryId: undefined },
    });
  if (min || max)
    chips.push({
      id: "p",
      text:
        min && max
          ? t("priceBetween", { a: min, b: max })
          : min
          ? t("priceFrom", { n: min })
          : t("priceTo", { n: max ?? "" }),
      clear: { priceMin: undefined, priceMax: undefined },
    });
  if (location)
    chips.push({ id: "l", text: location, clear: { location: undefined } });
  if (unit)
    chips.push({
      id: "u",
      text: unitLabel(tu, unit),
      clear: { unit: undefined },
    });

  if (!chips.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {chips.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => update(c.clear)}
            aria-label={t("removeFilter", { name: c.text })}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 ps-4 pe-3 text-sm transition-colors hover:border-pomegranate"
          >
            {c.text}
            <X className="size-3.5 text-muted" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default withSuspense(ActiveFiltersBody);
