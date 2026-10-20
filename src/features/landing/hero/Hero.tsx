import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import AuctionCard from "./AuctionCard";
import dict from "./hero.i18n";

export default async function Hero() {
  const t = await getT(dict);
  return (
    <section className="wrap grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
      <div>
        <h1 className="font-display text-4xl leading-[1.4] font-bold text-balance sm:text-5xl lg:text-6xl lg:leading-[1.35]">{t("title")}</h1>
        <p className="mt-6 max-w-[34rem] text-lg text-muted">{t("body")}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/market" className="btn btn-solid h-12 px-8">
            {t("browse")}
          </Link>
          <Link href="/signup" className="btn btn-line h-12 px-8">
            {t("sell")}
          </Link>
        </div>
        <p className="mt-6 max-w-[34rem] text-sm text-muted">{t("note")}</p>
      </div>
      <AuctionCard />
    </section>
  );
}
