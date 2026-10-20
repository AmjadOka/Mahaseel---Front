"use client";

import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "@/features/market/states.i18n";

export default function MarketError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT(dict);
  return (
    <div className="wrap grid place-items-center py-24 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("errorTitle")}</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">{t("errorText")}</p>
        <button type="button" onClick={reset} className="btn btn-solid mt-8">
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
