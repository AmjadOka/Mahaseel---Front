"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import { TextAreaField } from "@/components/field/Fields";
import StarRating from "@/components/stars/StarRating";
import Badge from "@/components/ui/Badge";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { cld } from "@/lib/cloudinary";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import { num } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import dict from "./account.i18n";
import {
  fetchAccount,
  removeAvatar,
  requestMerchant,
  updateProfile,
  uploadAvatar,
  type Account,
} from "./account-api";
import { useRefreshMe } from "@/features/auth/useMe";

function ProfileForm({ a }: { a: Account }) {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(a.fullName ?? "");
  const [bio, setBio] = useState(a.bio ?? "");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setSaved(false);
    setFormError(null);
    if (fullName.trim().length < 2) return setError(t("errName"));
    setError(undefined);
    setBusy(true);
    try {
      await updateProfile({ fullName: fullName.trim(), bio: bio.trim() });
      await qc.invalidateQueries({ queryKey: ["account"] });
      setSaved(true);
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {saved && <Alert tone="success">{t("saved")}</Alert>}
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field
        label={t("fullName")}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={error}
        autoComplete="name"
      />
      <Field label={t("email")} value={a.email ?? ""} readOnly ltr disabled />
      <TextAreaField
        label={t("bio")}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
      />
      <button type="submit" disabled={busy} className="btn btn-solid h-12 px-8">
        {busy && (
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {busy ? t("saving") : t("save")}
      </button>
    </form>
  );
}

function Avatar({ a }: { a: Account }) {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const done = () => {
    setError(null);
    return qc.invalidateQueries({ queryKey: ["account"] });
  };
  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: done,
    onError: (e) => setError(apiError(e)),
  });
  const remove = useMutation({
    mutationFn: removeAvatar,
    onSuccess: done,
    onError: (e) => setError(apiError(e)),
  });
  const name = a.fullName || a.email || "?";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-5">
        {a.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
          <img
            src={cld(a.profileImage, 200)}
            alt=""
            className="size-24 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-24 place-items-center rounded-full bg-grove text-3xl font-bold text-on-solid">
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex flex-col items-start gap-2">
          <label className="btn btn-line h-10 cursor-pointer px-4">
            {upload.isPending ? t("uploading") : t("changePhoto")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={upload.isPending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
          </label>
          {a.profileImage && (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
              className="text-sm text-pomegranate hover:underline"
            >
              {t("removePhoto")}
            </button>
          )}
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}

function Merchant({ a }: { a: Account }) {
  const t = useT(dict);
  const apiError = useApiError();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const role = norm(a.role);
  const promo = norm(a.promotionStatus);
  const refreshMe = useRefreshMe();
  const promote = useMutation({
    mutationFn: requestMerchant,
    onSuccess: () => {
      setError(null);
      void refreshMe();
      return qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e) => setError(apiError(e)),
  });

  if (role === "MERCHANT") {
    return (
      <Link href="/merchant/orders" className="btn btn-solid">
        {t("goMerchant")}
      </Link>
    );
  }
  if (role !== "BUYER") return null;
  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold">{t("becomeMerchant")}</h3>
      <p className="text-sm text-muted">{t("becomeMerchantHint")}</p>
      {error && <Alert tone="error">{error}</Alert>}
      {promo === "PENDING" ? (
        <Alert tone="success">{t("pending")}</Alert>
      ) : (
        <>
          {promo === "REJECTED" && <Alert tone="error">{t("rejected")}</Alert>}
          <button
            type="button"
            disabled={promote.isPending}
            onClick={() => promote.mutate()}
            className="btn btn-solid"
          >
            {promote.isPending && (
              <Loader2
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {promote.isPending ? t("promoting") : t("promote")}
          </button>
        </>
      )}
    </div>
  );
}

export default function AccountPage() {
  const ready = useRequireAuth();
  const t = useT(dict);
  const q = useQuery({
    queryKey: ["account"],
    queryFn: fetchAccount,
    enabled: ready,
  });

  return (
    <div className="wrap py-10 lg:py-14">
      <PageHead title={t("title")} sub={t("sub")} />
      {ready && (
        <QueryState q={q}>
          {(a) => {
            const avg = num(a.ratingAvg);
            const role = norm(a.role);
            return (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <section className="rounded-2xl border border-line bg-surface p-6">
                  <h2 className="mb-5 font-display text-lg font-bold">
                    {t("profile")}
                  </h2>
                  <ProfileForm key={`${a.fullName}|${a.bio}`} a={a} />
                </section>
                <div className="space-y-6">
                  <section className="rounded-2xl border border-line bg-surface p-6">
                    <h2 className="mb-5 font-display text-lg font-bold">
                      {t("avatar")}
                    </h2>
                    <Avatar key={a.profileImage ?? "none"} a={a} />
                  </section>
                  <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">
                        {t("accountType")}
                      </span>
                      <Badge tone="go">
                        {role === "BUYER" ||
                        role === "MERCHANT" ||
                        role === "ADMIN"
                          ? t(role)
                          : role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">{t("rating")}</span>
                      {avg !== null && avg > 0 ? (
                        <span className="flex items-center gap-2">
                          <StarRating value={avg} />
                          <span className="figure text-sm text-muted">
                            {t("ratingCount", { n: num(a.ratingCount) ?? 0 })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted">
                          {t("noRating")}
                        </span>
                      )}
                    </div>
                    <div className="border-t border-line pt-4">
                      <Merchant a={a} />
                    </div>
                  </section>
                </div>
              </div>
            );
          }}
        </QueryState>
      )}
    </div>
  );
}
