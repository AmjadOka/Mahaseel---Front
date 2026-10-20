"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import Money from "@/components/Money";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useAuthStore } from "@/stores/auth-store";
import { fmtNum } from "../format";
import { placeBid, placeOrder } from "../market-actions";
import unitsDict, { unitLabel } from "../units.i18n";
import dict from "./detail.i18n";

type Props = {
  id: string;
  merchantId?: string;
  auction: boolean;
  unit: string;
  /** What's left to order (fixed-price). */
  available: number;
  /** Fixed price per unit. Null means the listing has no price, and it can't be ordered. */
  unitPrice: number | null;
  /** The price a new bid is measured against: the current bid, else the starting price. */
  floor: number | null;
  /**
   * True when `floor` is a current bid, so a new bid must be above it. False when `floor` is the start
   * price, which the first bid may equal.
   */
  floorStrict?: boolean;
  onBidPlaced?: (amount: number) => void;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The backend takes the buyer's TOTAL as `offeredPrice`. The server must compute the total from the
 * listing and ignore this value, which is backend item B1. This client value is the displayed total only.
 */
export const orderTotal = (unitPrice: number, qty: number) =>
  Math.max(1, round2(unitPrice * qty));

export default function ActionPanel({
  id,
  merchantId,
  auction,
  unit,
  available,
  unitPrice,
  floor,
  floorStrict = false,
  onBidPlaced,
}: Props) {
  const t = useT(dict);
  const tu = useT(unitsDict);
  const apiError = useApiError();
  const router = useRouter();
  const qc = useQueryClient();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [value, setValue] = useState(auction ? "" : "1");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!hydrated)
    return (
      <div
        className="h-12 animate-pulse rounded-full bg-line/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    );

  if (!token) {
    return (
      <div className="space-y-3">
        <Link
          href={`/login?next=${encodeURIComponent(`/market/${id}`)}`}
          className="btn btn-solid h-12 w-full"
        >
          {auction ? t("loginToBid") : t("loginToOrder")}
        </Link>
        <p className="text-center text-sm text-muted">
          {t("noAccount")}{" "}
          <Link
            href="/signup"
            className="font-medium text-grove hover:underline"
          >
            {t("signup")}
          </Link>
        </p>
      </div>
    );
  }

  if (user?.id && merchantId && user.id === merchantId)
    return <Alert tone="success">{t("own")}</Alert>;
  if (user?.role && user.role !== "BUYER")
    return <Alert tone="error">{t("buyersOnly")}</Alert>;
  if (!auction && available <= 0)
    return <Alert tone="error">{t("soldOut")}</Alert>;
  // A fixed-price listing without a price can't be ordered. Showing it as orderable, and sending a total
  // of 1, would let a buyer pay almost nothing.
  if (!auction && unitPrice === null)
    return <Alert tone="error">{t("unavailable")}</Alert>;

  // The smallest bid the form accepts. Strictly above a current bid, which is stored to the cent. Equal to
  // the start price when there are no bids.
  const minBid =
    auction && floor !== null
      ? floorStrict
        ? round2(floor + 0.01)
        : floor
      : null;

  const qty = Number(value);
  const total =
    !auction && unitPrice !== null && Number.isFinite(qty) && qty > 0
      ? orderTotal(unitPrice, qty)
      : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    setDone(null);

    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return setFieldError(t("errPositive"));
    if (!auction && n > available)
      return setFieldError(t("errMax", { max: fmtNum(available) }));
    if (auction && minBid !== null && n < minBid)
      return setFieldError(t("errBidLow", { min: fmtNum(minBid) }));
    setFieldError(undefined);

    setBusy(true);
    try {
      if (auction) {
        await placeBid(id, n);
        onBidPlaced?.(n);
      } else {
        if (unitPrice === null) return; // guarded above; kept for the type checker
        await placeOrder({
          productId: id,
          quantity: n,
          offeredPrice: orderTotal(unitPrice, n),
          notes,
        });
      }
      setDone(auction ? t("bidDone") : t("orderDone"));
      setValue(auction ? "" : "1");
      setNotes("");
      void qc.invalidateQueries({ queryKey: ["orders"] });
      router.refresh();
    } catch (err) {
      setFormError(
        apiError(err, {
          400: t("rejected"),
          403: t("buyersOnly"),
          404: t("unavailable"),
          409: t("conflictMsg"),
        })
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="font-display text-lg font-bold">
        {auction ? t("bidTitle") : t("orderTitle")}
      </h2>
      {done && (
        <Alert tone="success">
          {done}
          {!auction && (
            <>
              {" "}
              <Link
                href="/orders"
                className="font-medium underline underline-offset-4"
              >
                {t("viewOrders")}
              </Link>
            </>
          )}
        </Alert>
      )}
      {formError && <Alert tone="error">{formError}</Alert>}

      <Field
        label={
          auction ? t("bidLabel") : t("qtyLabel", { unit: unitLabel(tu, unit) })
        }
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        ltr
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={fieldError}
        hint={
          auction
            ? minBid !== null
              ? t("bidHint", { min: fmtNum(minBid) })
              : undefined
            : t("qtyHint", { max: fmtNum(available) })
        }
      />

      {!auction && (
        <>
          <div>
            <label
              htmlFor="order-notes"
              className="mb-2 block text-sm font-medium"
            >
              {t("notesLabel")}
            </label>
            <textarea
              id="order-notes"
              rows={2}
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="input h-auto min-h-20 py-3"
            />
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
            <span className="text-sm text-muted">{t("totalLabel")}</span>
            <Money
              value={total}
              className="font-display text-2xl font-bold text-grove"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn btn-solid h-12 w-full"
      >
        {busy && (
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {auction
          ? busy
            ? t("bidding")
            : t("bidBtn")
          : busy
          ? t("ordering")
          : t("orderBtn")}
      </button>
    </form>
  );
}
