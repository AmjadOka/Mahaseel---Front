"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gavel } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Money from "@/components/Money";
import Badge, { type Tone } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import QueryState from "@/components/ui/QueryState";
import { asList } from "@/lib/api/paginate";
import { apiGet, apiPost } from "@/lib/api/client";
import { useApiError } from "@/lib/api/useApiError";
import { timeAgo } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import bidStatus from "@/features/bids/bid-status.i18n";
import { num } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import { BackToProducts } from "./ProductEditor";
import dict from "./merchant-bids.i18n";
import { fetchMyProduct } from "./products-api";

interface Bid {
  id: string;
  amount: number | string;
  status: string;
  createdAt?: string;
  buyer?: { fullName?: string | null; email?: string | null } | null;
}

const TONE: Record<string, Tone> = { ACTIVE: "go", WON: "done", LOST: "stop", WITHDRAWN: "stop" };

export default function ProductBids({ productId }: { productId: string }) {
  const t = useT(dict);
  const ts = useT(bidStatus);
  const { locale } = useLocale();
  const apiError = useApiError();
  const qc = useQueryClient();
  const [accepting, setAccepting] = useState<Bid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const product = useQuery({ queryKey: ["merchant-product", productId], queryFn: () => fetchMyProduct(productId) });
  const q = useQuery({
    queryKey: ["merchant-bids", productId],
    queryFn: async () => asList<Bid>(await apiGet<unknown>(`/auctions/merchant/products/${productId}/bids`)),
    refetchInterval: 15_000,
  });

  const accept = useMutation({
    mutationFn: (bidId: string) => apiPost(`/auctions/merchant/bids/${bidId}/accept`),
    onSuccess: () => {
      setAccepting(null);
      setDone(true);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["merchant-bids", productId] });
      void qc.invalidateQueries({ queryKey: ["merchant-products"] });
    },
    onError: (e) => {
      setAccepting(null);
      setError(apiError(e, { 400: t("failed"), 404: t("failed"), 409: t("busy"), 500: t("paymentDown") }));
    },
  });

  return (
    <div>
      <BackToProducts />
      <h1 className="mb-8 font-display text-3xl font-bold">
        {t("title")}
        {product.data && <span className="text-muted"> · {product.data.name}</span>}
      </h1>
      {done && (
        <div className="mb-6">
          <Alert tone="success">
            {t("accepted")}{" "}
            <Link href="/merchant/orders" className="font-medium underline underline-offset-4">
              {t("toOrders")}
            </Link>
          </Alert>
        </div>
      )}
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <QueryState q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={Gavel} title={t("empty")} hint={t("emptyHint")} />}>
        {(bids) => {
          const top = bids.find((b) => norm(b.status) === "ACTIVE");
          return (
            <ul className="space-y-3">
              {bids.map((b) => {
                const st = norm(b.status);
                return (
                  <li key={b.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-surface p-4 ${top?.id === b.id ? "border-grove" : "border-line"}`}>
                    <Money value={num(b.amount)} className="font-display text-2xl font-bold text-pomegranate" />
                    <div className="flex-1 text-sm text-muted">
                      {t("buyer")}: {b.buyer?.fullName || b.buyer?.email || "—"} · {timeAgo(b.createdAt, locale)}
                    </div>
                    {top?.id === b.id && <Badge tone="go">{t("highest")}</Badge>}
                    <Badge tone={TONE[st] ?? "wait"}>{st in TONE ? ts(st as "ACTIVE" | "WON" | "LOST" | "WITHDRAWN") : ts("UNKNOWN")}</Badge>
                    {st === "ACTIVE" && (
                      <button type="button" onClick={() => setAccepting(b)} className="btn btn-solid h-10 px-4">
                        {t("accept")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }}
      </QueryState>

      <ConfirmDialog
        open={!!accepting}
        title={t("acceptTitle")}
        body={t("acceptBody")}
        confirmLabel={t("acceptYes")}
        cancelLabel={t("cancel")}
        busy={accept.isPending}
        onConfirm={() => accepting && accept.mutate(accepting.id)}
        onClose={() => !accept.isPending && setAccepting(null)}
      />
    </div>
  );
}
