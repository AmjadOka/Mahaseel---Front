"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { getServerSnapshot, getSnapshot, setTheme, subscribe, type Theme } from "@/lib/theme/theme-store";
import dict from "./theme-toggle.i18n";

const OPTIONS: { value: Theme; Icon: LucideIcon }[] = [
  { value: "light", Icon: Sun },
  { value: "system", Icon: Monitor },
  { value: "dark", Icon: Moon },
];

export default function ThemeToggle() {
  const t = useT(dict);
  const { dir } = useLocale();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = OPTIONS.findIndex((o) => o.value === theme);

  function onKeyDown(e: KeyboardEvent) {
    const horizontal = dir === "rtl" ? -1 : 1;
    const step =
      e.key === "ArrowRight" ? horizontal : e.key === "ArrowLeft" ? -horizontal : e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    setTheme(OPTIONS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("group")}
      onKeyDown={onKeyDown}
      className="relative grid h-9 grid-cols-3 rounded-full border border-line bg-surface"
    >
      {/* sliding thumb — positioned with a logical property so it follows RTL/LTR */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 w-1/3 p-[3px] transition-[inset-inline-start] duration-200 ease-out motion-reduce:transition-none"
        style={{ insetInlineStart: `calc(${Math.max(index, 0)} * 100% / 3)` }}
      >
        <span className="block size-full rounded-full bg-grove-soft ring-1 ring-grove/40" />
      </span>
      {OPTIONS.map(({ value, Icon }, i) => (
        <button
          key={value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={t(value)}
          title={t(value)}
          tabIndex={theme === value ? 0 : -1}
          onClick={() => setTheme(value)}
          className={`relative grid w-9 place-items-center rounded-full transition-colors ${
            theme === value ? "text-grove" : "text-muted hover:text-ink"
          }`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
