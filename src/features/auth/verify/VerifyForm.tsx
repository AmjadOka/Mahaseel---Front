"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import OtpInput from "@/components/otp-input/OtpInput";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { resendVerification, verifyEmail } from "../auth-api";
import { OTP_LENGTH, isEmail } from "../validate";
import { useCooldown } from "../useCooldown";
import dict from "./verify.i18n";

function VerifyFormBody() {
  const t = useT(dict);
  const apiError = useApiError();
  const router = useRouter();
  const given = useSearchParams().get("email") ?? "";

  const [email, setEmail] = useState(given);
  const [code, setCode] = useState("");
  const [attempt, setAttempt] = useState(0); // remounts the code boxes after a failure
  const [emailError, setEmailError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useCooldown(30); // a code was just sent when we arrive from sign-up

  async function submit(value = code) {
    if (busy) return;
    setError(null);
    setInfo(null);
    if (!isEmail(email)) return setEmailError(t("errEmail"));
    setEmailError(undefined);
    if (value.length !== OTP_LENGTH) return setError(t("errCode"));

    setBusy(true);
    try {
      await verifyEmail(email.trim(), value);
      router.push("/login?verified=1");
    } catch (err) {
      setError(
        apiError(err, {
          400: t("wrongCode"),
          401: t("wrongCode"),
          422: t("wrongCode"),
        })
      );
      setCode("");
      setAttempt((a) => a + 1);
      setBusy(false);
    }
  }

  async function resend() {
    if (wait > 0 || busy) return;
    if (!isEmail(email)) return setEmailError(t("errEmail"));
    setEmailError(undefined);
    setError(null);
    try {
      await resendVerification(email.trim());
      setInfo(t("resent"));
      setWait(60);
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">
        {given ? t("sub", { email: given }) : t("subNoEmail")}
      </p>

      <div className="mt-6 space-y-3 empty:hidden">
        {error && <Alert tone="error">{error}</Alert>}
        {info && <Alert tone="success">{info}</Alert>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
        className="mt-6 space-y-6"
      >
        {!given && (
          <Field
            label={t("email")}
            type="email"
            ltr
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />
        )}

        <div>
          <p id="otp-label" className="mb-3 text-sm font-medium">
            {t("code")}
          </p>
          <OtpInput
            key={attempt}
            label={t("code")}
            value={code}
            onChange={setCode}
            onComplete={(v) => void submit(v)}
            invalid={!!error}
            disabled={busy}
            autoFocus
          />
          <p className="mt-3 text-sm text-muted">{t("expires")}</p>
        </div>

        <button
          type="submit"
          disabled={busy || code.length !== OTP_LENGTH}
          className="btn btn-solid h-12 w-full"
        >
          {busy && (
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {busy ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={wait > 0}
          className="font-medium text-grove hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {wait > 0 ? t("resendIn", { s: wait }) : t("resend")}
        </button>
        <Link href="/login" className="text-muted hover:text-ink">
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}

export default withSuspense(VerifyFormBody);
