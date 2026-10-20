"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import { signUp } from "../auth-api";
import GoogleButton from "../GoogleButton";
import { MIN_PASSWORD, isEmail } from "../validate";
import dict from "./signup.i18n";

type Errors = Partial<Record<"fullName" | "email" | "password" | "confirm", string>>;

export default function SignupForm() {
  const t = useT(dict);
  const apiError = useApiError();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Errors = {};
    if (form.fullName.trim().length < 2) next.fullName = t("errName");
    if (!isEmail(form.email)) next.email = t("errEmail");
    if (form.password.length < MIN_PASSWORD) next.password = t("errShort", { min: MIN_PASSWORD });
    else if (form.confirm !== form.password) next.confirm = t("errMismatch");
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setBusy(true);
    try {
      const email = form.email.trim();
      await signUp({ fullName: form.fullName.trim(), email, password: form.password });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setFormError(apiError(err, { 409: t("errExists") }));
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("sub")}</p>

      {formError && (
        <div className="mt-6">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <Field label={t("fullName")} autoComplete="name" value={form.fullName} onChange={set("fullName")} error={errors.fullName} />
        <Field label={t("email")} type="email" ltr autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
        <Field
          label={t("password")}
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          hint={t("passwordHint")}
        />
        <Field label={t("confirm")} type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
        <button type="submit" disabled={busy} className="btn btn-solid h-12 w-full">
          {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {busy ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="my-6 flex items-center gap-4 text-sm text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">{t("or")}</p>
      <GoogleButton label={t("google")} />

      <p className="mt-8 text-center text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-grove hover:underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
