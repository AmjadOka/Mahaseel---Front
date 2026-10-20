"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Sprout } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Dialog from "@/components/dialog/Dialog";
import Field from "@/components/field/Field";
import Money from "@/components/Money";
import Badge, { type Tone } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { useApiError } from "@/lib/api/useApiError";
import { cld } from "@/lib/cloudinary";
import { useT } from "@/lib/i18n/LocaleProvider";
import { auctionEnded, availableOf, coverOf, fmtNum, isAuction, num } from "@/features/market/format";
import type { Product } from "@/features/market/types";
import unitsDict, { unitLabel } from "@/features/market/units.i18n";
import { norm } from "@/features/orders/status";
import dict from "./products.i18n";
import { deleteProduct, fetchMyProducts, relistProduct } from "./products-api";

const STATUSES = ["ACTIVE", "PENDING_REVIEW", "DRAFT", "SOLD", "EXPIRED", "REJECTED", "ARCHIVED", "INACTIVE"] as const;
type St = (typeof STATUSES)[number];
const TONE: Record<St, Tone> = { ACTIVE: "go", PENDING_REVIEW: "wait", DRAFT: "wait", SOLD: "done", EXPIRED: "stop", REJECTED: "pay", ARCHIVED: "stop", INACTIVE: "pay" };

export function ProductStatusBadge({ status }: { status?: string }) {
  const t = useT(dict);
  const k = norm(status) as St;
  return <Badge tone={TONE[k] ?? "wait"}>{k in TONE ? t(k) : t("UNKNOWN")}</Badge>;
}

export default function ProductsList() {
  const t = useT(dict);
  const tu = useT(unitsDict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<St | "ALL">("ALL");
  const [removing, setRemoving] = useState<Product | null>(null);
  const [relisting, setRelisting] = useState<Product | null>(null);
  const [relistQty, setRelistQty] = useState("");
  const [relistError, setRelistError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["merchant-products"], queryFn: fetchMyProducts });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["merchant-products"] });
    setError(null);
  };

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      setRemoving(null);
      refresh();
    },
    onError: (e) => {
      setRemoving(null);
      // 409: the product has open orders or bids. The default 409 text says a record
      // already exists, which is wrong here.
      setError(apiError(e, { 400: t("actionFailed"), 404: t("actionFailed"), 409: t("hasOpenOrders") }));
    },
  });

  const relist = useMutation({
    mutationFn: (v: { id: string; quantity?: number }) => relistProduct(v.id, v.quantity),
    onSuccess: () => {
      setRelisting(null);
      refresh();
    },
    onError: (e) => {
      setRelisting(null);
      setError(apiError(e, { 400: t("actionFailed"), 404: t("actionFailed") }));
    },
  });

  const openRelist = (p: Product) => {
    if (isAuction(p)) {
      relist.mutate({ id: p.id });
      return;
    }
    // A fixed-price product needs a new quantity to go back on sale.
    setRelisting(p);
    setRelistQty(String(num(p.quantity) ?? ""));
    setRelistError(null);
  };

  const submitRelist = (e: FormEvent) => {
    e.preventDefault();
    if (!relisting) return;
    const quantity = Number(relistQty);
    if (!(quantity > 0)) {
      setRelistError(t("errQty"));
      return;
    }
    relist.mutate({ id: relisting.id, quantity });
  };

  const add = (
    <Link href="/merchant/products/new" className="btn btn-solid">
      {t("add")}
    </Link>
  );

  return (
    <div>
      <PageHead title={t("title")} sub={t("sub")} action={add} />
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <QueryState q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={Package} title={t("empty")} hint={t("emptyHint")} action={add} />}>
        {(all) => {
          const list = filter === "ALL" ? all : all.filter((p) => norm(p.status) === filter);
          return (
            <>
              <div role="tablist" className="mb-6 flex flex-wrap gap-1.5">
                {(["ALL", ...STATUSES] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={filter === s}
                    onClick={() => setFilter(s)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${filter === s ? "border-grove bg-grove-soft font-medium text-grove" : "border-line text-muted hover:text-ink"}`}
                  >
                    {s === "ALL" ? t("all") : t(s)}
                  </button>
                ))}
              </div>

              {list.length === 0 ? (
                <p className="py-10 text-center text-muted">{t("emptyFilter")}</p>
              ) : (
                <ul className="space-y-3">
                  {list.map((p) => {
                    const auction = isAuction(p);
                    const status = norm(p.status);
                    const img = coverOf(p);
                    const price = auction ? (num(p.currentBid) ?? num(p.auctionStartPrice)) : num(p.fixedPrice);
                    return (
                      <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
                        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-grove-soft">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
                            <img src={cld(img, 200)} alt="" loading="lazy" className="size-full object-cover" />
                          ) : (
                            <div className="grid size-full place-items-center text-grove/40">
                              <Sprout className="size-7" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="line-clamp-1 font-display text-lg font-bold">{p.name}</h2>
                            <ProductStatusBadge status={p.status} />
                            <Badge tone={auction ? "pay" : "go"}>{auction ? t("auction") : t("fixed")}</Badge>
                          </div>
                          <p className="text-sm text-muted">
                            {auction ? (num(p.currentBid) !== null ? t("currentBid") : t("startPrice")) : t("price")}: <Money value={price} className="font-bold text-ink" /> · {t("available")}:{" "}
                            <span className="figure">{fmtNum(availableOf(p))}</span> {unitLabel(tu, p.unit)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {status !== "SOLD" && (
                            <Link href={`/merchant/products/${p.id}`} className="btn btn-line h-10 px-4">
                              {t("edit")}
                            </Link>
                          )}
                          {auction && (
                            <Link href={`/merchant/products/${p.id}/bids`} className="btn btn-line h-10 px-4">
                              {t("bids")}
                            </Link>
                          )}
                          {(status === "SOLD" || status === "EXPIRED" || auctionEnded(p)) && status !== "ACTIVE" && (
                            <button type="button" disabled={relist.isPending} onClick={() => openRelist(p)} className="btn btn-solid h-10 px-4">
                              {t("relist")}
                            </button>
                          )}
                          <button type="button" onClick={() => setRemoving(p)} className="btn btn-line h-10 px-4 text-pomegranate">
                            {t("remove")}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          );
        }}
      </QueryState>

      <Dialog open={!!relisting} title={t("relistTitle")} onClose={() => !relist.isPending && setRelisting(null)}>
        <form onSubmit={submitRelist} noValidate className="space-y-4">
          {relistError && <Alert tone="error">{relistError}</Alert>}
          <Field
            label={`${t("relistQty")} (${unitLabel(tu, relisting?.unit ?? "")})`}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            ltr
            value={relistQty}
            onChange={(e) => setRelistQty(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRelisting(null)} disabled={relist.isPending} className="btn btn-line">
              {t("cancel")}
            </button>
            <button type="submit" disabled={relist.isPending} className="btn btn-solid">
              {t("relistYes")}
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        title={t("removeTitle")}
        body={t("removeBody")}
        confirmLabel={t("removeYes")}
        cancelLabel={t("cancel")}
        danger
        busy={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
        onClose={() => !remove.isPending && setRemoving(null)}
      />
    </div>
  );
}
