"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Gavel, Sprout } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Countdown from "@/components/countdown/Countdown";
import Money from "@/components/Money";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { apiDelete, apiGet } from "@/lib/api/client";
import { asList } from "@/lib/api/paginate";
import { useApiError } from "@/lib/api/useApiError";
import { cld } from "@/lib/cloudinary";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import { coverOf, num } from "@/features/market/format";
import type { Product } from "@/features/market/types";
import { norm } from "@/features/orders/status";
import dict from "./bids.i18n";

interface MyBid {
  id: string;
  amount: number | string;
  status: string;
  product?: Product | null;
}

export default function MyBids() {
  const ready = useRequireAuth();
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [withdrawing, setWithdrawing] = useState<MyBid | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["my-bids"],
    // Standing bids only. Won, lost and withdrawn bids are history with nothing to act on.
    queryFn: async () => asList<MyBid>(await apiGet<unknown>("/auctions/bids/mine")).filter((b) => norm(b.status) === "ACTIVE"),
    enabled: ready,
    refetchInterval: 15_000,
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => apiDelete(`/auctions/bids/${id}`),
    onSuccess: () => {
      setWithdrawing(null);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["my-bids"] });
    },
    onError: (e) => {
      setWithdrawing(null);
      // 409: the server refused because this is the highest bid. The default 409 text says the
      // system is busy, which is misleading here.
      setError(apiError(e, { 400: t("failed"), 404: t("failed"), 409: t("topBid") }));
    },
  });

  return (
    <div className="wrap py-10 lg:py-14">
      <PageHead title={t("title")} sub={t("sub")} />
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {ready && (
        <QueryState
          q={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon={Gavel} title={t("empty")} hint={t("emptyHint")} action={<Link href="/market" className="btn btn-solid">{t("browse")}</Link>} />}
        >
          {(bids) => (
            <ul className="space-y-3">
              {bids.map((b) => {
                const p = b.product;
                const mine = num(b.amount) ?? 0;
                const top = num(p?.currentBid);
                // Known only when the current bid is in the response. Without it, the server's answer decides.
                const leading = top !== null && mine >= top;
                const img = p ? coverOf(p) : null;
                return (
                  <li key={b.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
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
                        <h2 className="line-clamp-1 font-display text-lg font-bold">{p?.name ?? t("deletedProduct")}</h2>
                        {top !== null && <Badge tone={leading ? "go" : "pay"}>{leading ? t("highest") : t("outbid")}</Badge>}
                      </div>
                      <p className="text-sm text-muted">
                        {t("mine")}: <Money value={mine} className="font-bold text-ink" /> · {t("current")}: <Money value={top ?? mine} className="font-bold text-pomegranate" />
                      </p>
                      {p?.auctionEndAt && (
                        <p className="flex items-center gap-2 text-sm text-pomegranate">
                          <Clock className="size-3.5" aria-hidden="true" />
                          <Countdown endAt={p.auctionEndAt} />
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p?.id && (
                        <Link href={`/market/${p.id}`} className="btn btn-line h-10 px-4">
                          {t("view")}
                        </Link>
                      )}
                      {!leading && (
                        <button type="button" onClick={() => setWithdrawing(b)} className="btn btn-line h-10 px-4 text-pomegranate">
                          {t("withdraw")}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </QueryState>
      )}

      <ConfirmDialog
        open={!!withdrawing}
        title={t("withdrawTitle")}
        body={t("withdrawBody")}
        confirmLabel={t("withdrawYes")}
        cancelLabel={t("keep")}
        danger
        busy={withdraw.isPending}
        onConfirm={() => withdrawing && withdraw.mutate(withdrawing.id)}
        onClose={() => !withdraw.isPending && setWithdrawing(null)}
      />
    </div>
  );
}
