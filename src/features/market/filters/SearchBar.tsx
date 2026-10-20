"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { withSuspense } from "@/lib/with-suspense";
import dict from "./filters.i18n";
import { useMarketNav } from "./useMarketNav";

function SearchBarBody() {
  const t = useT(dict);
  const update = useMarketNav();
  const urlQ = useSearchParams().get("q") ?? "";
  const [value, setValue] = useState(urlQ);
  /** The query this box last wrote to the URL. Lets the box tell its own URL update apart from an outside change. */
  const pushed = useRef(urlQ);

  // Pushes the box's value to the URL 400 ms after the last keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      const v = value.trim();
      if (v === pushed.current) return;
      pushed.current = v;
      update({ q: v || undefined });
    }, 400);
    return () => clearTimeout(id);
  }, [value, update]);

  // Follows the URL only when it changes to something this box didn't write. The old code
  // always followed it, so a push that landed while the user was still typing overwrote the
  // newer keystrokes, and the box jumped back.
  useEffect(() => {
    if (urlQ === pushed.current) return;
    pushed.current = urlQ;
    setValue(urlQ);
  }, [urlQ]);

  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        pushed.current = v;
        update({ q: v || undefined });
      }}
    >
      <Search
        className="pointer-events-none absolute inset-y-0 start-4 my-auto size-4 text-muted"
        aria-hidden="true"
      />
      <input
        type="text"
        enterKeyHint="search"
        value={value}
        maxLength={100}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        className="input ps-11 pe-11 text-base"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            pushed.current = "";
            update({ q: undefined });
          }}
          aria-label={t("clearSearch")}
          className="absolute inset-y-0 end-0 grid w-11 place-items-center text-muted hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}

export default withSuspense(SearchBarBody);
