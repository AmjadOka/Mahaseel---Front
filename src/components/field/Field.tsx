"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./field.i18n";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  /** Emails, codes, passwords: type left-to-right even on an RTL page. */
  ltr?: boolean;
  labelEnd?: ReactNode;
};

export default function Field({ label, error, hint, ltr, labelEnd, type, className = "", ...rest }: Props) {
  const id = useId();
  const t = useT(dict);
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const forceLtr = ltr || isPassword;
  const describedBy = [error && `${id}-err`, hint && !error && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelEnd}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          // `direction` as CSS (not a dir attribute) keeps the rtl:/ltr: variants keyed to the page direction.
          className={`input ${forceLtr ? "[direction:ltr] rtl:text-right" : ""} ${isPassword ? "ltr:pr-12 rtl:pl-12" : ""} ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? t("hide") : t("show")}
            aria-pressed={shown}
            className="absolute inset-y-0 end-0 grid w-12 place-items-center text-muted transition-colors hover:text-ink"
          >
            {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-2 text-sm text-pomegranate">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
