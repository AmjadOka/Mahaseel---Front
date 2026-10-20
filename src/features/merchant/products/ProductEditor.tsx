"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Alert from "@/components/Alert";
import AssetManager, { type Asset } from "@/components/asset-manager/AssetManager";
import QueryState from "@/components/ui/QueryState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { isAuction, isVideo, mediaOf } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import ProductForm from "./ProductForm";
import { ProductStatusBadge } from "./ProductsList";
import dict from "./products.i18n";
import { deleteAuctionImage, deleteProductMedia, fetchMyProduct, uploadAuctionImage, uploadProductMedia } from "./products-api";

export function BackToProducts() {
  const t = useT(dict);
  return (
    <Link href="/merchant/products" className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
      <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
      {t("back")}
    </Link>
  );
}

export default function ProductEditor({ id, justCreated }: { id: string; justCreated?: boolean }) {
  const t = useT(dict);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["merchant-product", id], queryFn: () => fetchMyProduct(id) });
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["merchant-product", id] });
    void qc.invalidateQueries({ queryKey: ["merchant-products"] });
  };

  return (
    <div>
      <BackToProducts />
      <QueryState q={q}>
        {(p) => {
          const media: Asset[] = mediaOf(p).map((m) => ({ id: m.id, url: m.url, kind: isVideo(m) ? "video" : "image" }));
          const cover: Asset[] = p.auctionImageUrl ? [{ id: "cover", url: p.auctionImageUrl, kind: "image" }] : [];
          return (
            <div className="space-y-12">
              <div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-bold">{p.name}</h1>
                  <ProductStatusBadge status={p.status} />
                </div>
                {justCreated && (
                  <div className="mb-6 max-w-2xl">
                    <Alert tone="success">{t("createdNotice")}</Alert>
                  </div>
                )}
                {norm(p.status) === "SOLD" ? <Alert tone="error">{t("soldLocked")}</Alert> : <ProductForm product={p} />}
              </div>

              <section className="max-w-2xl">
                <h2 className="mb-4 font-display text-xl font-bold">{t("mediaTitle")}</h2>
                <AssetManager
                  assets={media}
                  accept="image/*,video/*"
                  onUpload={async (files) => {
                    await uploadProductMedia(id, files);
                    await refresh();
                  }}
                  onRemove={async (mediaId) => {
                    await deleteProductMedia(id, mediaId);
                    await refresh();
                  }}
                />
              </section>

              {isAuction(p) && (
                <section className="max-w-2xl">
                  <h2 className="font-display text-xl font-bold">{t("coverTitle")}</h2>
                  <p className="mb-4 mt-1 text-sm text-muted">{t("coverHint")}</p>
                  <AssetManager
                    assets={cover}
                    accept="image/*"
                    max={1}
                    onUpload={async (files) => {
                      await uploadAuctionImage(id, files[0]);
                      await refresh();
                    }}
                    onRemove={async () => {
                      await deleteAuctionImage(id);
                      await refresh();
                    }}
                  />
                </section>
              )}
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
