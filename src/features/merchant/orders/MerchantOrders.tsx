"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Inbox, Sprout } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import { TextAreaField } from "@/components/field/Fields";
import Money from "@/components/Money";
import PageNav from "@/components/page-nav/PageNav";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { useApiError } from "@/lib/api/useApiError";
import { cld } from "@/lib/cloudinary";
import { DELIVERY_STATUS } from "@/lib/enums";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { coverOf, fmtNum, num } from "@/features/market/format";
import unitsDict, { unitLabel } from "@/features/market/units.i18n";
import { norm } from "@/features/orders/status";
import StatusBadge from "@/features/orders/StatusBadge";
import type { Order } from "@/features/orders/types";
import RateOrder from "@/features/ratings/RateOrder";
import dict from "./merchant-orders.i18n";
import {
  acceptOrder,
  fetchIncoming,
  nextDeliverySteps,
  rejectOrder,
  updateDelivery,
  type DeliveryStep,
} from "./merchant-orders-api";

function MerchantOrdersBody() {
  const t = useT(dict);
  const tu = useT(unitsDict);
  const { locale } = useLocale();
  const apiError = useApiError();
  const qc = useQueryClient();
  const page = Math.max(
    1,
    Math.floor(Number(useSearchParams().get("page"))) || 1
  );

  const [dialog, setDialog] = useState<{
    kind: "accept" | "reject";
    order: Order;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["merchant-orders", page],
    queryFn: () => fetchIncoming(page),
    placeholderData: keepPreviousData,
  });

  const closeDialog = () => {
    setDialog(null);
    setReason("");
  };
  const done = () => {
    void qc.invalidateQueries({ queryKey: ["merchant-orders"] });
    closeDialog();
    setError(null);
  };
  // 500 and 503 both mean the payment provider didn't respond, so both get the same message.
  const failed = (e: unknown) => {
    closeDialog();
    setError(
      apiError(e, {
        400: t("actionFailed"),
        500: t("paymentDown"),
        503: t("paymentDown"),
      })
    );
  };
  const accept = useMutation({
    mutationFn: (id: string) => acceptOrder(id),
    onSuccess: done,
    onError: failed,
  });
  const reject = useMutation({
    mutationFn: (v: { id: string; reason: string }) =>
      rejectOrder(v.id, v.reason),
    onSuccess: done,
    onError: failed,
  });
  const deliver = useMutation({
    mutationFn: (v: { o: Order; step: DeliveryStep }) =>
      updateDelivery(v.o.id, DELIVERY_STATUS[v.step]),
    onSuccess: done,
    onError: failed,
  });

  const busy = accept.isPending || reject.isPending || deliver.isPending;

  return (
    <div>
      <PageHead title={t("title")} sub={t("sub")} />
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <QueryState
        q={q}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <EmptyState icon={Inbox} title={t("empty")} hint={t("emptyHint")} />
        }
      >
        {(d) => (
          <>
            <ul className="space-y-4">
              {d.items.map((o) => {
                const status = norm(o.status);
                const img = o.product ? coverOf(o.product) : null;
                const steps = status === "ACCEPTED" ? nextDeliverySteps(o) : [];
                // The phone number is in the response only after acceptance, so show it only then.
                const phone =
                  status === "ACCEPTED" || status === "COMPLETED"
                    ? o.buyer?.phone
                    : null;
                return (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-line bg-surface p-5"
                  >
                    <div className="flex gap-4">
                      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-grove-soft">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
                          <img
                            src={cld(img, 200)}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-grove/40">
                            <Sprout className="size-7" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h2 className="line-clamp-1 font-display text-lg font-bold">
                            {o.product?.name ?? t("deletedProduct")}
                          </h2>
                          <StatusBadge order={o} />
                        </div>
                        <p className="text-sm text-muted">
                          {t("buyer")}:{" "}
                          {o.buyer?.fullName || o.buyer?.email || "—"} ·{" "}
                          {t("placedOn", {
                            date: fmtDate(o.createdAt, locale),
                          })}
                        </p>
                        {phone && (
                          <p className="text-sm">
                            {t("buyerPhone")}:{" "}
                            <a
                              href={`tel:${phone}`}
                              dir="ltr"
                              className="font-medium text-grove underline underline-offset-4"
                            >
                              {phone}
                            </a>
                          </p>
                        )}
                        <p className="text-sm">
                          {t("qty")}:{" "}
                          <span className="figure">
                            {fmtNum(num(o.quantity) ?? 0)}
                          </span>{" "}
                          {unitLabel(tu, o.unit)} · {t("total")}:{" "}
                          <Money
                            value={num(o.finalPrice ?? o.offeredPrice)}
                            className="font-bold text-grove"
                          />
                        </p>
                      </div>
                    </div>

                    {o.notes && (
                      <p className="mt-4 rounded-lg border border-line bg-paper p-3 text-sm">
                        <span className="text-muted">{t("notes")}: </span>
                        {o.notes}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                      {status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setDialog({ kind: "accept", order: o })
                            }
                            className="btn btn-solid h-10"
                          >
                            {t("accept")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setDialog({ kind: "reject", order: o })
                            }
                            className="btn btn-line h-10"
                          >
                            {t("reject")}
                          </button>
                        </>
                      )}
                      {status === "AWAITING_PAYMENT" && (
                        <p className="text-sm text-muted">
                          {t("waitingPayment")}
                        </p>
                      )}
                      {steps.length > 0 && (
                        <>
                          <span className="text-sm text-muted">
                            {t("deliveryNext")}
                          </span>
                          {steps.map((step) => (
                            <button
                              key={step}
                              type="button"
                              disabled={busy}
                              onClick={() => deliver.mutate({ o, step })}
                              className="btn btn-solid h-10"
                            >
                              {t(`act${step}` as const)}
                            </button>
                          ))}
                        </>
                      )}
                      {status === "ACCEPTED" &&
                        steps.length === 0 &&
                        norm(o.deliveryStatus) === "DELIVERED" && (
                          <p className="text-sm text-muted">
                            {t("waitingConfirm")}
                          </p>
                        )}
                    </div>

                    {status === "COMPLETED" && (
                      <details className="mt-4 border-t border-line pt-4">
                        <summary className="cursor-pointer text-sm font-medium text-grove">
                          {t("rate")}
                        </summary>
                        <div className="mt-4">
                          <RateOrder orderId={o.id} />
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
            <PageNav
              page={d.page}
              totalPages={d.totalPages}
              hrefFor={(n) =>
                n > 1 ? `/merchant/orders?page=${n}` : "/merchant/orders"
              }
            />
          </>
        )}
      </QueryState>

      <ConfirmDialog
        open={dialog?.kind === "accept"}
        title={t("acceptTitle")}
        body={t("acceptBody")}
        confirmLabel={t("acceptYes")}
        cancelLabel={t("cancel")}
        busy={accept.isPending}
        onConfirm={() => dialog && accept.mutate(dialog.order.id)}
        onClose={() => !busy && closeDialog()}
      />
      <ConfirmDialog
        open={dialog?.kind === "reject"}
        title={t("rejectTitle")}
        confirmLabel={t("rejectYes")}
        cancelLabel={t("cancel")}
        danger
        busy={reject.isPending}
        confirmDisabled={reason.trim().length === 0}
        onConfirm={() =>
          dialog &&
          reject.mutate({ id: dialog.order.id, reason: reason.trim() })
        }
        onClose={() => !busy && closeDialog()}
      >
        <TextAreaField
          label={t("rejectReason")}
          hint={t("rejectReasonHint")}
          maxLength={500}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}

export default withSuspense(MerchantOrdersBody);
