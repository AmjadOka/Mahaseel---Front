"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, dirFor, type Locale } from "./locale";
import { makeT, type Dict, type TFn } from "./translate";

type Ctx = { locale: Locale; setLocale: (next: Locale) => void };
const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, set] = useState<Locale>(initial);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // Flip lang/dir immediately — router.refresh() alone doesn't reliably update <html>.
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      set(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return { ...ctx, dir: dirFor(ctx.locale) };
}

/** Client-component `t()` for one section's dictionary. */
export function useT<K extends string>(dict: Dict<K>): TFn<K> {
  const { locale } = useLocale();
  return useMemo(() => makeT(dict, locale), [dict, locale]);
}
