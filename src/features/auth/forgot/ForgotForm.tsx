"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import OtpInput from "@/components/otp-input/OtpInput";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import { changePassword, sendResetCode, verifyResetCode } from "../auth-api";
import { MIN_PASSWORD, OTP_LENGTH, isEmail } from "../validate";
import { useCooldown } from "../useCooldown";
import dict from "./forgot.i18n";

type Step = 1 | 2 | 3;

export default function ForgotForm() {
  const t = useT(dict);
  const apiError = useApiError();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useCooldown(0);

  const reset = () => {
    setError(null);
    setInfo(null);
    setFieldError({});
  };

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    reset();
    if (!isEmail(email)) return setFieldError({ email: t("errEmail") });
    setBusy(true);
    try {
      await sendResetCode(email.trim());
      setStep(2);
      setWait(60);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(value = code) {
    if (busy) return;
    reset();
    if (value.length !== OTP_LENGTH) return setError(t("errCode"));
    setBusy(true);
    try {
      await verifyResetCode(email.trim(), value);
      setStep(3);
    } catch (err) {
      setError(apiError(err, { 400: t("wrongCode"), 401: t("wrongCode"), 422: t("wrongCode") }));
      setCode("");
      setAttempt((a) => a + 1);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (wait > 0 || busy) return;
    reset();
    try {
      await sendResetCode(email.trim());
      setInfo(t("resent"));
      setWait(60);
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    reset();
    if (password.length < MIN_PASSWORD) return setFieldError({ password: t("errShort", { min: MIN_PASSWORD }) });
    if (confirm !== password) return setFieldError({ confirm: t("errMismatch") });
    setBusy(true);
    try {
      // The code was already checked in the verify step, which lets this request through for a
      // short window. The request carries only the email and the new password.
      await changePassword(email.trim(), password);
      router.push("/login?reset=1");
    } catch (err) {
      setError(apiError(err, { 400: t("wrongCode"), 401: t("wrongCode") }));
      setBusy(false);
    }
  }

  const spinner = <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />;

  return (
    <div>
      <div className="flex gap-1.5" role="img" aria-label={t("step", { n: step })}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= step ? "bg-grove" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{t("step", { n: step })}</p>

      <h1 className="mt-2 font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{step === 1 ? t("sub1") : step === 2 ? t("sub2", { email }) : t("sub3")}</p>

      <div className="mt-6 space-y-3 empty:hidden">
        {error && <Alert tone="error">{error}</Alert>}
        {info && <Alert tone="success">{info}</Alert>}
      </div>

      {step === 1 && (
        <form onSubmit={sendCode} noValidate className="mt-6 space-y-5">
          <Field label={t("email")} type="email" ltr autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError.email} />
          <button type="submit" disabled={busy} className="btn btn-solid h-12 w-full">
            {busy && spinner}
            {busy ? t("sending") : t("send")}
          </button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
          className="mt-6 space-y-6"
        >
          <OtpInput key={attempt} label={t("code")} value={code} onChange={setCode} onComplete={(v) => void verify(v)} invalid={!!error} disabled={busy} autoFocus />
          <button type="submit" disabled={busy || code.length !== OTP_LENGTH} className="btn btn-solid h-12 w-full">
            {busy && spinner}
            {busy ? t("verifying") : t("verify")}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={resend}
              disabled={wait > 0}
              className="font-medium text-grove hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              {wait > 0 ? t("resendIn", { s: wait }) : t("resend")}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setCode("");
                setStep(1);
              }}
              className="text-muted hover:text-ink"
            >
              {t("useOther")}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={submitPassword} noValidate className="mt-6 space-y-5">
          <Field
            label={t("password")}
            type="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldError.password}
            hint={t("passwordHint")}
          />
          <Field label={t("confirm")} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={fieldError.confirm} />
          <button type="submit" disabled={busy} className="btn btn-solid h-12 w-full">
            {busy && spinner}
            {busy ? t("changing") : t("change")}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="text-muted hover:text-ink">
          {t("back")}
        </Link>
      </p>
    </div>
  );
}
