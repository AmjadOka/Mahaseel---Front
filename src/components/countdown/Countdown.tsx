"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./countdown.i18n";

const pad = (n: number) => String(n).padStart(2, "0");

/** Ticks on the client only, so server and client markup never disagree. */
export default function Countdown({ endAt, className = "" }: { endAt: string; className?: string }) {
  const t = useT(dict);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endAt).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt]);

  if (left === null) return <span className={`figure ${className}`}>--:--:--</span>;
  if (left === 0) return <span className={`font-medium text-pomegranate ${className}`}>{t("ended")}</span>;

  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);

  return d > 0 ? (
    <span className={`figure ${className}`}>{t("days", { d, h })}</span>
  ) : (
    <span className={`figure ${className}`}>
      {pad(h)}:{pad(m)}:{pad(s % 60)}
    </span>
  );
}
