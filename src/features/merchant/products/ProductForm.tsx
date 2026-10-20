"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import { SelectField, TextAreaField } from "@/components/field/Fields";
import { apiGet } from "@/lib/api/client";
import { useApiError } from "@/lib/api/useApiError";
import { DELIVERY_METHOD, SALE_METHOD } from "@/lib/enums";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { loadCategoryTree } from "@/features/market/categories";
import { flattenCategories, isAuction, num } from "@/features/market/format";
import { UNITS, type Product } from "@/features/market/types";
import unitsDict, { unitLabel } from "@/features/market/units.i18n";
import { norm } from "@/features/orders/status";
import { fetchFarms } from "../farms/farms-api";
import dict from "./product-form.i18n";
import { createProduct, updateProduct, type ProductInput } from "./products-api";

type Errors = Partial<Record<"farmId" | "name" | "quantity" | "price" | "duration", string>>;

/** The server's ceiling for an auction, in hours (30 days). */
const MAX_AUCTION_HOURS = 720;

export default function ProductForm({ product }: { product?: Product }) {
  const t = useT(dict);
  const tu = useT(unitsDict);
  const { locale } = useLocale();
  const apiError = useApiError();
  const router = useRouter();
  const qc = useQueryClient();
  const editing = !!product;

  const farms = useQuery({ queryKey: ["farms"], queryFn: fetchFarms });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => loadCategoryTree((p) => apiGet(p, undefined, { auth: false })), staleTime: 5 * 60_000 });
  const approved = (farms.data ?? []).filter((f) => norm(f.status) === "APPROVED");

  const [v, setV] = useState(() => ({
    farmId: product?.farm?.id ?? "",
    categoryId: product?.category?.id ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    quantity: product ? String(num(product.quantity) ?? "") : "",
    unit: product?.unit?.toLowerCase() ?? UNITS[0],
    saleMethod: product && isAuction(product) ? SALE_METHOD.AUCTION : SALE_METHOD.FIXED,
    price: product ? String((isAuction(product) ? num(product.auctionStartPrice) : num(product.fixedPrice)) ?? "") : "",
    duration: "24",
    deliveryMethod: norm((product as { deliveryMethod?: string } | undefined)?.deliveryMethod) === "DRIVER" ? DELIVERY_METHOD.DRIVER : DELIVERY_METHOD.FROM_FARM,
    driverName: (product as { driverName?: string } | undefined)?.driverName ?? "",
    driverPhone: (product as { driverPhone?: string } | undefined)?.driverPhone ?? "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  const auction = v.saleMethod === SALE_METHOD.AUCTION;
  const driver = v.deliveryMethod === DELIVERY_METHOD.DRIVER;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Errors = {};
    const qty = Number(v.quantity);
    const price = Number(v.price);
    const hours = Number(v.duration);
    if (!editing && !v.farmId) next.farmId = t("errFarm");
    if (!v.name.trim()) next.name = t("errName");
    if (!(qty > 0)) next.quantity = t("errQty");
    if (!(price > 0)) next.price = t("errPrice");
    if (!editing && auction) {
      if (!Number.isInteger(hours) || hours < 1) next.duration = t("errDuration");
      else if (hours > MAX_AUCTION_HOURS) next.duration = t("errDurationMax");
    }
    setErrors(next);
    setFormError(null);
    setSaved(false);
    if (Object.keys(next).length) return;

    const common = {
      categoryId: v.categoryId || undefined,
      name: v.name.trim(),
      description: v.description.trim() || (editing ? "" : undefined),
      quantity: qty,
      unit: v.unit,
      deliveryMethod: v.deliveryMethod,
      driverName: driver ? v.driverName.trim() || undefined : undefined,
      driverPhone: driver ? v.driverPhone.trim() || undefined : undefined,
    };
    setBusy(true);
    try {
      if (editing) {
        const body: Partial<ProductInput> = { ...common, ...(isAuction(product) ? { auctionStartPrice: price } : { fixedPrice: price }) };
        await updateProduct(product.id, body);
        setSaved(true);
        void qc.invalidateQueries({ queryKey: ["merchant-products"] });
        void qc.invalidateQueries({ queryKey: ["merchant-product", product.id] });
      } else {
        // The end time is what the server stores. products-api derives the duration from it,
        // so the two can't disagree.
        const body: ProductInput = {
          ...common,
          farmId: v.farmId,
          saleMethod: v.saleMethod,
          ...(auction
            ? { auctionStartPrice: price, auctionEndAt: new Date(Date.now() + hours * 3_600_000).toISOString() }
            : { fixedPrice: price }),
        };
        const created = await createProduct(body);
        void qc.invalidateQueries({ queryKey: ["merchant-products"] });
        router.replace(created?.id ? `/merchant/products/${created.id}?created=1` : "/merchant/products");
      }
    } catch (err) {
      // A 400 on create is most often a farm that stopped being approved. On edit it's a
      // validation error, so it gets the generic message.
      setFormError(apiError(err, editing ? {} : { 400: t("farmNotApproved") }));
    } finally {
      setBusy(false);
    }
  }

  if (!editing && farms.isSuccess && approved.length === 0) {
    return (
      <div className="max-w-lg space-y-4">
        <Alert tone="error">{t("noFarms")}</Alert>
        <Link href="/merchant/farms" className="btn btn-solid">
          {t("addFarm")}
        </Link>
      </div>
    );
  }

  const radio = (value: string, text: string, locked = false) => (
    <label key={value} className={`flex flex-1 items-center justify-center rounded-xl border px-4 py-3 text-sm transition-colors ${v.saleMethod === value ? "border-grove bg-grove-soft font-medium text-grove" : "border-line"} ${locked ? "opacity-60" : "cursor-pointer hover:border-grove"}`}>
      <input type="radio" name="saleMethod" value={value} checked={v.saleMethod === value} disabled={locked} onChange={set("saleMethod")} className="sr-only" />
      {text}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="max-w-2xl space-y-5">
      {saved && <Alert tone="success">{t("saved")}</Alert>}
      {formError && <Alert tone="error">{formError}</Alert>}

      {!editing && (
        <SelectField label={t("farm")} value={v.farmId} onChange={set("farmId")} error={errors.farmId}>
          <option value="" />
          {approved.map((f) => (
            <option key={f.id} value={f.id}>
              {f.displayName || f.name}
            </option>
          ))}
        </SelectField>
      )}

      <Field label={t("name")} value={v.name} onChange={set("name")} error={errors.name} maxLength={200} />
      <TextAreaField label={t("description")} value={v.description} onChange={set("description")} rows={4} />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label={t("category")} value={v.categoryId} onChange={set("categoryId")}>
          <option value="">{t("noCategory")}</option>
          {flattenCategories(cats.data ?? [], locale).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label={t("quantity")} type="number" inputMode="decimal" step="any" min={0} ltr value={v.quantity} onChange={set("quantity")} error={errors.quantity} />
          <SelectField label={t("unit")} value={v.unit} onChange={set("unit")} className="min-w-28">
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {unitLabel(tu, u)}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">{t("saleMethod")}</span>
        <div className="flex gap-3">
          {radio(SALE_METHOD.FIXED, t("fixed"), editing)}
          {radio(SALE_METHOD.AUCTION, t("auction"), editing)}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={auction ? t("startPrice") : t("fixedPrice")} type="number" inputMode="decimal" step="any" min={0} ltr value={v.price} onChange={set("price")} error={errors.price} />
        {auction && !editing && <Field label={t("duration")} type="number" inputMode="numeric" min={1} max={MAX_AUCTION_HOURS} ltr value={v.duration} onChange={set("duration")} error={errors.duration} hint={t("durationHint")} />}
      </div>

      <SelectField label={t("delivery")} value={v.deliveryMethod} onChange={set("deliveryMethod")}>
        <option value={DELIVERY_METHOD.FROM_FARM}>{t("fromFarm")}</option>
        <option value={DELIVERY_METHOD.DRIVER}>{t("driver")}</option>
      </SelectField>
      {driver && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("driverName")} value={v.driverName} onChange={set("driverName")} />
          <Field label={t("driverPhone")} type="tel" ltr value={v.driverPhone} onChange={set("driverPhone")} />
        </div>
      )}

      <button type="submit" disabled={busy} className="btn btn-solid h-12 px-8">
        {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {busy ? t("saving") : editing ? t("save") : t("create")}
      </button>
    </form>
  );
}
