"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import { ApiError } from "@/lib/api/client";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import { useAuthStore } from "@/stores/auth-store";
import {
  fetchMe,
  homeFor,
  navigateAfterAuth,
  safeNext,
  signIn,
} from "../auth-api";
import GoogleButton from "../GoogleButton";
import { isEmail } from "../validate";
import dict from "./login.i18n";

function LoginFormBody() {
  const t = useT(dict);
  const apiError = useApiError();
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (!isEmail(email)) next.email = t("errEmail");
    if (!password) next.password = t("errPassword");
    setErrors(next);
    setFormError(null);
    setUnverified(false);
    if (next.email || next.password) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus()
      );
      return;
    }

    setBusy(true);
    try {
      const tokens = await signIn(email.trim(), password);
      const { setTokens, setUser } = useAuthStore.getState();
      setTokens(tokens);
      let role;
      try {
        const me = await fetchMe();
        setUser(me);
        role = me.role;
      } catch {
        // profile can load on the next page; the tokens are what matter here
      }
      await navigateAfterAuth(safeNext(params.get("next")) ?? homeFor(role));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setUnverified(true);
      setFormError(
        apiError(err, { 401: t("errCredentials"), 403: t("unverified") })
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("sub")}</p>

      <div className="mt-6 space-y-3 empty:hidden">
        {params.get("verified") && (
          <Alert tone="success">{t("verified")}</Alert>
        )}
        {params.get("reset") && <Alert tone="success">{t("reset")}</Alert>}
        {formError && (
          <Alert tone="error">
            {formError}
            {unverified && (
              <>
                {" "}
                <Link
                  href={`/verify-email?email=${encodeURIComponent(
                    email.trim()
                  )}`}
                  className="font-medium underline underline-offset-4"
                >
                  {t("verifyNow")}
                </Link>
              </>
            )}
          </Alert>
        )}
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className="mt-6 space-y-5"
      >
        <Field
          label={t("email")}
          type="email"
          ltr
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label={t("password")}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelEnd={
            <Link
              href="/forgot-password"
              className="text-sm text-grove hover:underline"
            >
              {t("forgot")}
            </Link>
          }
        />
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
          {busy ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="my-6 flex items-center gap-4 text-sm text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        {t("or")}
      </p>
      <GoogleButton label={t("google")} />

      <p className="mt-8 text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-grove hover:underline">
          {t("signup")}
        </Link>
      </p>
    </div>
  );
}

export default withSuspense(LoginFormBody);
