"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Money from "@/components/Money";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./hero.i18n";

const TOTAL = 2 * 3600 + 14 * 60 + 37; // demo countdown, seconds
const EVERY = 4; // a new bid lands every 4 seconds
const START_PRICE = 120;
const amountAt = (k: number) => 150 + 5 * k + 5 * Math.floor(k / 3);
const pad = (n: number) => String(n).padStart(2, "0");

export default function AuctionCard() {
  const t = useT(dict);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // The one moving thing on the page. Stays still for people who ask for less motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTick((s) => (s + 1) % 600), 1000);
    return () => clearInterval(id);
  }, []);

  const left = TOTAL - tick;
  const n = Math.floor(tick / EVERY);
  // Bids are numbered from 0, the opening bid. The old code could go below zero early on, which showed
  // bids that were placed before the auction started.
  const bids = [0, 1, 2].map((i) => {
    const k = Math.max(0, n - i);
    return { amount: amountAt(k), age: tick - k * EVERY };
  });
  const ago = (s: number) => (s < 5 ? t("now") : s < 60 ? t("secAgo", { n: s }) : t("minAgo", { n: Math.floor(s / 60) }));

  return (
    <aside
      aria-label={t("cardLabel")}
      className="rounded-s-md rounded-e-3xl border border-s-4 border-line border-s-pomegranate bg-surface p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-pomegranate">
          <span className="size-2.5 rounded-full bg-pomegranate motion-safe:animate-pulse" aria-hidden="true" />
          {t("live")}
        </span>
        <span className="text-muted">
          {t("endsIn")}{" "}
          <span className="figure font-medium text-ink">
            {pad(Math.floor(left / 3600))}:{pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}
          </span>
        </span>
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{t("product")}</h2>
        <span className="text-xs text-muted">{t("sample")}</span>
      </div>
      <p className="text-muted">{t("unit")}</p>

      <p className="mt-7 text-sm text-muted">{t("top")}</p>
      <p key={bids[0].amount} className="font-display text-6xl leading-tight font-bold motion-safe:animate-bump">
        <Money value={bids[0].amount} />
      </p>

      <p className="mt-6 border-b border-line pb-2 text-sm text-muted">{t("recent")}</p>
      <ol>
        {bids.map((b, i) => (
          <li key={i} className="flex items-center justify-between border-b border-line/60 py-2.5 last:border-0">
            <Money value={b.amount} className={i === 0 ? "font-bold text-pomegranate" : "text-ink"} />
            <span className="text-sm text-muted">{ago(b.age)}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {t("start")} <Money value={START_PRICE} className="text-ink" />
        </p>
        <Link href="/market" className="btn btn-solid">
          {t("bid")}
        </Link>
      </div>
    </aside>
  );
}
