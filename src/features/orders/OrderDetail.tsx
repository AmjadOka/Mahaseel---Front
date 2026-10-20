"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sprout } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Money from "@/components/Money";
import { ApiError } from "@/lib/api/base";
import { useApiError } from "@/lib/api/useApiError";
import { cld } from "@/lib/cloudinary";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import RateOrder from "@/features/ratings/RateOrder";
import { coverOf, fmtNum, num } from "@/features/market/format";
import unitsDict, { unitLabel } from "@/features/market/units.i18n";
import dict from "./order-detail.i18n";
import { cancelOrder, confirmReceipt, fetchOrder, startPayment } from "./orders-api";
import OrderTracker from "./OrderTracker";
import { isStopped, norm } from "./status";
import StatusBadge from "./StatusBadge";
import type { Order } from "./types";

export default function OrderDetail({ id }: { id: string }) {
  const ready = useRequireAuth();
  const t = useT(dict);
  const tu = useT(unitsDict);
  const { locale } = useLocale();
  const apiError = useApiError();
  const qc = useQueryClient();

  const [dialog, setDialog] = useState<"cancel" | "confirm" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["order", id], queryFn: () => fetchOrder(id), enabled: ready });

  const afterChange = (next: Order) => {
    if (next?.id) qc.setQueryData(["order", id], next);
    else void qc.invalidateQueries({ queryKey: ["order", id] });
    void qc.invalidateQueries({ queryKey: ["orders"] });
    setDialog(null);
    setError(null);
  };
  const onError = (e: unknown) => {
    setDialog(null);
    setError(apiError(e, { 400: t("stateChanged"), 404: t("notFound") }));
  };

  const cancel = useMutation({ mutationFn: () => cancelOrder(id), onSuccess: afterChange, onError });
  const confirm = useMutation({ mutationFn: () => confirmReceipt(id), onSuccess: afterChange, onError });
  const pay = useMutation({
    mutationFn: async () => q.data?.payment?.gatewayUrl || (await startPayment(id)),
    onSuccess: (url) => window.location.assign(url),
    onError: (e) => setError(apiError(e, { 400: t("stateChanged"), 500: t("payFailed") })),
  });

  const back = (
    <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
      <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
      {t("back")}
    </Link>
  );

  if (!ready || q.isPending) {
    return (
      <div className="wrap py-8 lg:py-12">
        {back}
        <div className="mt-6 animate-pulse space-y-4 motion-reduce:animate-none" aria-hidden="true">
          <div className="h-10 w-1/2 rounded bg-line/60" />
          <div className="h-24 rounded-2xl bg-line/60" />
          <div className="h-56 rounded-2xl bg-line/60" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    const missing = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 400 || q.error.status === 403);
    return (
      <div className="wrap py-8 lg:py-12">
        {back}
        <div className="mt-6 max-w-lg space-y-4">
          <Alert tone="error">{missing ? t("notFound") : t("loadError")}</Alert>
          {!missing && (
            <button type="button" onClick={() => q.refetch()} className="btn btn-line">
              {t("retry")}
            </button>
          )}
        </div>
      </div>
    );
  }

  const o = q.data;
  const status = norm(o.status);
  const delivery = norm(o.deliveryStatus);
  const img = o.product ? coverOf(o.product) : null;
  const busy = cancel.isPending || confirm.isPending;

  const message =
    status === "PENDING" ? t("msgPending")
    : status === "AWAITING_PAYMENT" ? t("msgPay")
    : status === "COMPLETED" ? t("msgCompleted")
    : status === "REJECTED" ? t("msgRejected")
    : status === "CANCELLED" ? t("msgCancelled")
    : delivery === "DELIVERED" ? t("msgDelivered")
    : delivery === "IN_DELIVERY" ? t("msgInDelivery")
    : delivery === "READY_PICKUP" ? t("msgReadyPickup")
    : delivery === "PREPARING" ? t("msgPreparing")
    : t("msgPaid");

  return (
    <div className="wrap py-8 lg:py-12">
      {back}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{o.product?.name ?? t("deletedProduct")}</h1>
        <StatusBadge order={o} />
      </div>

      {!isStopped(o) && (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <OrderTracker order={o} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold">{t("summary")}</h2>
          <div className="mt-4 flex gap-4">
            <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-grove-soft">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
                <img src={cld(img, 240)} alt="" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-grove/40">
                  <Sprout className="size-8" aria-hidden="true" />
                </div>
              )}
            </div>
            <dl className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("quantity")}</dt>
                <dd className="font-medium">
                  <span className="figure">{fmtNum(num(o.quantity) ?? 0)}</span> {unitLabel(tu, o.unit)}
                </dd>
              </div>
              {norm(o.deliveryMethod) && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("delivery")}</dt>
                  <dd className="font-medium">{norm(o.deliveryMethod) === "DRIVER" ? t("driverDelivery") : t("fromFarm")}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("total")}</dt>
                <dd>
                  <Money value={num(o.finalPrice)} className="text-lg font-bold text-grove" />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("placedOn")}</dt>
                <dd className="font-medium">{fmtDate(o.createdAt, locale)}</dd>
              </div>
            </dl>
          </div>
          {o.notes && (
            <p className="mt-4 border-t border-line pt-4 text-sm">
              <span className="text-muted">{t("notes")}: </span>
              {o.notes}
            </p>
          )}
          {o.productId && o.product && (
            <Link href={`/market/${o.productId}`} className="mt-4 inline-block text-sm font-medium text-grove hover:underline">
              {t("viewProduct")}
            </Link>
          )}
        </section>

        <section className="space-y-4 self-start rounded-2xl border border-line bg-surface p-6">
          {error && <Alert tone="error">{error}</Alert>}
          <p className={status === "REJECTED" || status === "CANCELLED" ? "font-medium" : ""}>{message}</p>
          {(status === "REJECTED" || status === "CANCELLED") && o.rejectionReason && (
            <p className="rounded-lg border border-line border-s-4 border-s-pomegranate bg-paper p-3 text-sm">
              <span className="text-muted">{t("reason")}: </span>
              {o.rejectionReason}
            </p>
          )}

          {status === "AWAITING_PAYMENT" && (
            <button type="button" onClick={() => pay.mutate()} disabled={pay.isPending} className="btn btn-solid h-12 w-full">
              {pay.isPending && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {pay.isPending ? t("paying") : t("pay")}
            </button>
          )}
          {status === "PENDING" && (
            <button type="button" onClick={() => setDialog("cancel")} className="btn btn-line h-12 w-full">
              {t("cancelOrder")}
            </button>
          )}
          {status === "COMPLETED" && <div className="border-t border-line pt-4"><RateOrder orderId={o.id} /></div>}
          {status === "ACCEPTED" && delivery === "DELIVERED" && (
            <button type="button" onClick={() => setDialog("confirm")} className="btn btn-solid h-12 w-full">
              {t("confirmReceipt")}
            </button>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={dialog === "cancel"}
        title={t("cancelTitle")}
        body={t("cancelBody")}
        confirmLabel={t("cancelYes")}
        cancelLabel={t("keep")}
        busy={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onClose={() => !busy && setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "confirm"}
        title={t("confirmTitle")}
        body={t("confirmBody")}
        confirmLabel={t("confirmYes")}
        cancelLabel={t("keep")}
        busy={confirm.isPending}
        onConfirm={() => confirm.mutate()}
        onClose={() => !busy && setDialog(null)}
      />
    </div>
  );
}
