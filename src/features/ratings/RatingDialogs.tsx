"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Dialog from "@/components/dialog/Dialog";
import { SelectField, TextAreaField } from "@/components/field/Fields";
import StarRating from "@/components/stars/StarRating";
import { ApiError } from "@/lib/api/base";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./ratings.i18n";
import { flagRating, updateRating, type Rating } from "./ratings-api";

/**
 * Values match the backend's FlagReason enum (rating.entity.ts). The server rejects any other
 * value with 400, so change these only together with the enum.
 */
const FLAG_REASONS = [
  { value: "fake", label: "reasonFake" },
  { value: "offensive", label: "reasonOffensive" },
  { value: "irrelevant", label: "reasonIrrelevant" },
  { value: "other", label: "reasonOther" },
] as const;

const Buttons = ({ busy, label, onCancel }: { busy: boolean; label: string; onCancel: () => void }) => {
  const t = useT(dict);
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} disabled={busy} className="btn btn-line">
        {t("cancel")}
      </button>
      <button type="submit" disabled={busy} className="btn btn-solid">
        {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {label}
      </button>
    </div>
  );
};

function EditForm({ rating, onClose }: { rating: Rating; onClose: () => void }) {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [score, setScore] = useState(Number(rating.score) || 0);
  const [comment, setComment] = useState(rating.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (score < 1) return setError(t("errScore"));
    setBusy(true);
    setError(null);
    try {
      await updateRating(rating.id, { score, comment });
      await qc.invalidateQueries({ queryKey: ["ratings"] });
      onClose();
    } catch (err) {
      // 409: the rating is under review. The default 409 text says a record already exists, which is wrong here.
      setError(apiError(err, { 403: t("notAllowed"), 409: t("underReview") }));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <StarRating value={score} onChange={setScore} size="size-7" />
      <TextAreaField label={t("comment")} maxLength={500} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />
      <Buttons busy={busy} label={t("save")} onCancel={onClose} />
    </form>
  );
}

function FlagForm({ rating, onClose }: { rating: Rating; onClose: () => void }) {
  const t = useT(dict);
  const apiError = useApiError();
  const [reason, setReason] = useState<string>(FLAG_REASONS[0].value);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"sent" | "already" | null>(null);
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="success">{done === "sent" ? t("reportDone") : t("reportAlready")}</Alert>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-solid">
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await flagRating(rating.id, { reason, notes });
      setDone("sent");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setDone("already");
      else setError(apiError(err, { 403: t("reportDenied") }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-muted">{t("reportHint")}</p>
      {error && <Alert tone="error">{error}</Alert>}
      <SelectField label={t("reportReason")} value={reason} onChange={(e) => setReason(e.target.value)}>
        {FLAG_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {t(r.label)}
          </option>
        ))}
      </SelectField>
      <TextAreaField label={t("reportNotes")} maxLength={300} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Buttons busy={busy} label={t("reportSend")} onCancel={onClose} />
    </form>
  );
}

export function EditRatingDialog({ rating, onClose }: { rating: Rating | null; onClose: () => void }) {
  const t = useT(dict);
  return (
    <Dialog open={!!rating} title={t("editTitle")} onClose={onClose}>
      {rating && <EditForm rating={rating} onClose={onClose} />}
    </Dialog>
  );
}

export function FlagRatingDialog({ rating, onClose }: { rating: Rating | null; onClose: () => void }) {
  const t = useT(dict);
  return (
    <Dialog open={!!rating} title={t("reportTitle")} onClose={onClose}>
      {rating && <FlagForm rating={rating} onClose={onClose} />}
    </Dialog>
  );
}
