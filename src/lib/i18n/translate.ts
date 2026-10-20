import type { Locale } from "./locale";

type Vars = Record<string, string | number>;

export type Dict<K extends string = string> = Record<Locale, Record<K, string>>;
export type TFn<K extends string> = (key: K, vars?: Vars) => string;

/**
 * Each section owns one dictionary file: `export default defineDict({ ar: {...}, en: {...} })`.
 * `en` must define exactly the keys of `ar` — a missing or extra key is a compile error.
 */
export function defineDict<T extends Record<string, string>>(d: {
  ar: T;
  en: Record<keyof T, string>;
}): Dict<Extract<keyof T, string>> {
  return d;
}

export function makeT<K extends string>(dict: Dict<K>, locale: Locale): TFn<K> {
  return (key, vars) => {
    let out = dict[locale][key] ?? dict.ar[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        out = out.replaceAll(`{${name}}`, String(value));
      }
    }
    return out;
  };
}
