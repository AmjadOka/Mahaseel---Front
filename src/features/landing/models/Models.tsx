import { getT } from "@/lib/i18n/server";
import dict from "./models.i18n";

export default async function Models() {
  const t = await getT(dict);
  const rows = [
    ["rPrice", "fPrice", "aPrice"],
    ["rBuy", "fBuy", "aBuy"],
    ["rBack", "fBack", "aBack"],
    ["rFit", "fFit", "aFit"],
  ] as const;

  return (
    <section id="models" className="wrap py-16 lg:py-24">
      <h2 className="max-w-2xl font-display text-3xl leading-snug font-bold text-balance sm:text-4xl">{t("title")}</h2>
      <p className="mt-4 max-w-xl text-muted">{t("body")}</p>

      <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="hidden grid-cols-[11rem_1fr_1fr] border-b border-line bg-grove-soft font-display text-lg font-bold md:grid">
          <span />
          <span className="p-5">{t("fixed")}</span>
          <span className="border-s border-line p-5 text-pomegranate">{t("auction")}</span>
        </div>
        {rows.map(([label, f, a]) => (
          <div key={label} className="grid border-b border-line last:border-0 md:grid-cols-[11rem_1fr_1fr]">
            <p className="px-5 pt-5 font-medium md:py-5">{t(label)}</p>
            <p className="px-5 pt-2 md:py-5">
              <span className="text-sm text-muted md:hidden">{t("fixed")}: </span>
              {t(f)}
            </p>
            <p className="px-5 pt-2 pb-5 md:border-s md:border-line md:py-5">
              <span className="text-sm text-pomegranate md:hidden">{t("auction")}: </span>
              {t(a)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
