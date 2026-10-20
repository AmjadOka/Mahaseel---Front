import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import dict from "./cta.i18n";

export default async function Cta() {
  const t = await getT(dict);
  return (
    <section className="wrap pb-16 lg:pb-24">
      <div className="rounded-3xl bg-grove px-8 py-12 text-on-solid sm:px-14 sm:py-16">
        <h2 className="max-w-xl font-display text-3xl leading-snug font-bold text-balance sm:text-4xl">{t("title")}</h2>
        <p className="mt-4 max-w-xl opacity-90">{t("body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="btn h-12 bg-on-solid px-8 text-grove hover:opacity-90">
            {t("signup")}
          </Link>
          <Link href="/login" className="btn h-12 border border-on-solid/50 px-8 hover:bg-on-solid/10">
            {t("login")}
          </Link>
        </div>
      </div>
    </section>
  );
}
