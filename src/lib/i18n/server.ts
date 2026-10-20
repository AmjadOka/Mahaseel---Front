import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locale";
import { makeT, type Dict } from "./translate";

export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Server-component `t()` for one section's dictionary. */
export async function getT<K extends string>(dict: Dict<K>) {
  return makeT(dict, await getServerLocale());
}
