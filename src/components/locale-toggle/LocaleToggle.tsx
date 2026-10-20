"use client";

import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import dict from "./locale-toggle.i18n";

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  const t = useT(dict);
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      aria-label={t("switchTo")}
      title={t("switchTo")}
      className="grid h-9 min-w-9 place-items-center rounded-full border border-line bg-surface px-2 text-sm font-medium transition-colors hover:border-grove"
    >
      <span lang={locale === "ar" ? "en" : "ar"}>{t("label")}</span>
    </button>
  );
}
