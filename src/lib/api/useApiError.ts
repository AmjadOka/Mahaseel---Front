"use client";

import { useT } from "@/lib/i18n/LocaleProvider";
import { ApiError } from "./client";
import dict from "./errors.i18n";

/** Turns any thrown value into a translated message. `overrides` lets a form say what a given status means for it. */
export function useApiError() {
  const t = useT(dict);
  return (err: unknown, overrides: Partial<Record<number, string>> = {}): string => {
    if (!(err instanceof ApiError)) return t("unknown");
    const own = overrides[err.status];
    if (own) return own;
    if (err.status === 0) return t("network");
    if (err.status === 429) return t("tooMany");
    if (err.status === 409) return t("conflict");
    if (err.status === 401) return t("unauthorized");
    if (err.status === 403) return t("forbidden");
    if (err.status === 404) return t("notFound");
    if (err.status >= 500) return t("server");
    return t("invalid");
  };
}
