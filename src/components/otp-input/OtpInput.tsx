"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./otp-input.i18n";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  label: string;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function OtpInput({ value, onChange, onComplete, label, length = 6, invalid, disabled, autoFocus }: Props) {
  const t = useT(dict);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };
  const focus = (i: number) => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  function onInput(i: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const at = Math.min(i, value.length); // digits are always filled left to right
    const next = (value.slice(0, at) + digits).slice(0, length);
    commit(next);
    focus(next.length);
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) commit(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        commit(value.slice(0, i - 1) + value.slice(i));
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1); // boxes are laid out left-to-right in both languages
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  }

  function onPaste(e: ClipboardEvent) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    e.preventDefault();
    commit(digits);
    focus(digits.length);
  }

  return (
    <div role="group" aria-label={label} onPaste={onPaste} className="flex justify-between gap-2 [direction:ltr] sm:gap-3">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length} // lets a full SMS/autofill code arrive in one box
          disabled={disabled}
          aria-label={t("digit", { n: i + 1, total: length })}
          aria-invalid={invalid ? true : undefined}
          className="input figure h-14 min-w-0 flex-1 px-0 text-center font-display text-2xl font-bold"
        />
      ))}
    </div>
  );
}
