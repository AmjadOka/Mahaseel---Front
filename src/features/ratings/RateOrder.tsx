"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import { TextAreaField } from "@/components/field/Fields";
import StarRating from "@/components/stars/StarRating";
import { ApiError } from "@/lib/api/base";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./ratings.i18n";
import { createRating } from "./ratings-api";

/** Both sides can rate once an order is completed; the backend enforces one rating per reviewer per order (409). */
export default function RateOrder({ orderId }: { orderId: string }) {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"thanks" | "already" | null>(null);
  const [busy, setBusy] = useState(false);

  if (done) return <Alert tone="success">{done === "thanks" ? t("thanks") : t("already")}</Alert>;

  async function submit() {
    if (score < 1) return setError(t("errScore"));
    setError(null);
    setBusy(true);
    try {
      await createRating({ orderId, score, comment });
      setDone("thanks");
      void qc.invalidateQueries({ queryKey: ["ratings"] });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setDone("already");
      else setError(apiError(e, { 400: t("notAllowed"), 403: t("notAllowed") }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold">{t("rateTitle")}</h3>
      {error && <Alert tone="error">{error}</Alert>}
      <StarRating value={score} onChange={setScore} size="size-7" />
      <TextAreaField label={t("comment")} placeholder={t("commentPlaceholder")} maxLength={500} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="button" onClick={() => void submit()} disabled={busy} className="btn btn-solid">
        {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {busy ? t("sending") : t("submit")}
      </button>
    </div>
  );
}
