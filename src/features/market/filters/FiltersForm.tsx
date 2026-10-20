"use client";

import { useId, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { FILTER_KEYS, isMethod } from "../query";
import { SALE_METHOD } from "@/lib/enums";
import { UNITS, type CategoryOption } from "../types";
import unitsDict, { unitLabel } from "../units.i18n";
import dict from "./filters.i18n";
import { useMarketNav } from "./useMarketNav";

const label = "mb-2 block text-sm font-medium";
const numeric = "figure rtl:text-right";
const positive = (s: string) => (Number(s) >= 1 ? String(Number(s)) : undefined);

function Form({ categories, onDone }: { categories: CategoryOption[]; onDone?: () => void }) {
  const t = useT(dict);
  const tu = useT(unitsDict);
  const uid = useId();
  const sp = useSearchParams();
  const update = useMarketNav();
  const [v, setV] = useState({
    categoryId: sp.get("categoryId") ?? "",
    saleMethod: sp.get("saleMethod") ?? "",
    priceMin: sp.get("priceMin") ?? "",
    priceMax: sp.get("priceMax") ?? "",
    location: sp.get("location") ?? "",
    unit: (sp.get("unit") ?? "").toLowerCase(),
  });
  const set = (k: keyof typeof v, val: string) => setV((s) => ({ ...s, [k]: val }));
  const invalid = !!v.priceMin && !!v.priceMax && Number(v.priceMax) < Number(v.priceMin);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (invalid) return;
    update({
      categoryId: v.categoryId || undefined,
      saleMethod: v.saleMethod || undefined,
      priceMin: positive(v.priceMin),
      priceMax: positive(v.priceMax),
      location: v.location.trim() || undefined,
      unit: v.unit || undefined,
    });
    onDone?.();
  }

  function reset() {
    update(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])));
    onDone?.();
  }

  const methods = [
    { value: "", text: t("all") },
    { value: SALE_METHOD.FIXED, text: t("fixed") },
    { value: SALE_METHOD.AUCTION, text: t("auction") },
  ];

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div role="group" aria-labelledby={`${uid}-method`}>
        <span id={`${uid}-method`} className={label}>
          {t("saleMethod")}
        </span>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-line bg-surface p-1">
          {methods.map((m) => {
            const active = isMethod(v.saleMethod, m.value);
            return (
              <button
                key={m.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => set("saleMethod", m.value)}
                className={`rounded-full px-2 py-2 text-sm transition-colors ${
                  active ? "bg-grove-soft font-medium text-grove ring-1 ring-grove/40" : "text-muted hover:text-ink"
                }`}
              >
                {m.text}
              </button>
            );
          })}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <label htmlFor={`${uid}-cat`} className={label}>
            {t("category")}
          </label>
          <select id={`${uid}-cat`} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="input">
            <option value="">{t("allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div role="group" aria-labelledby={`${uid}-price`}>
        <span id={`${uid}-price`} className={label}>
          {t("price")} (₪)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" inputMode="decimal" min={1} value={v.priceMin} onChange={(e) => set("priceMin", e.target.value)} placeholder={t("priceMin")} aria-label={t("priceMin")} className={`input ${numeric}`} />
          <input
            type="number"
            inputMode="decimal"
            min={1}
            value={v.priceMax}
            onChange={(e) => set("priceMax", e.target.value)}
            placeholder={t("priceMax")}
            aria-label={t("priceMax")}
            aria-invalid={invalid || undefined}
            className={`input ${numeric}`}
          />
        </div>
        {invalid && (
          <p role="alert" className="mt-2 text-sm text-pomegranate">
            {t("priceInvalid")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${uid}-loc`} className={label}>
          {t("location")}
        </label>
        <input id={`${uid}-loc`} type="text" maxLength={150} value={v.location} onChange={(e) => set("location", e.target.value)} placeholder={t("locationPlaceholder")} className="input" />
      </div>

      <div>
        <label htmlFor={`${uid}-unit`} className={label}>
          {t("unit")}
        </label>
        <select id={`${uid}-unit`} value={v.unit} onChange={(e) => set("unit", e.target.value)} className="input">
          <option value="">{t("allUnits")}</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {unitLabel(tu, u)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={invalid} className="btn btn-solid flex-1">
          {t("apply")}
        </button>
        <button type="button" onClick={reset} className="btn btn-line">
          {t("reset")}
        </button>
      </div>
    </form>
  );
}

/** Remounts only when the filter params change in the URL (not while the search box is typed in). */
export default function FiltersPanel(props: { categories: CategoryOption[]; onDone?: () => void }) {
  const sp = useSearchParams();
  const key = FILTER_KEYS.map((k) => sp.get(k) ?? "").join("|");
  return <Form key={key} {...props} />;
}
