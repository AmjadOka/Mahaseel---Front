import { getT } from "@/lib/i18n/server";
import dict from "./flow.i18n";

export default async function Flow() {
  const t = await getT(dict);
  const steps = [
    ["s1", "d1"],
    ["s2", "d2"],
    ["s3", "d3"],
    ["s4", "d4"],
  ] as const;

  return (
    <section id="flow" className="border-y border-line bg-surface">
      <div className="wrap py-16 lg:py-24">
        <h2 className="max-w-2xl font-display text-3xl leading-snug font-bold text-balance sm:text-4xl">{t("title")}</h2>
        <p className="mt-4 max-w-xl text-muted">{t("body")}</p>

        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([s, d], i) => (
            <li key={s} className="border-t-2 border-grove pt-5">
              <span className="figure font-display text-4xl font-bold text-grove">{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{t(s)}</h3>
              <p className="mt-2 text-muted">{t(d)}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-sm text-muted">{t("note")}</p>
      </div>
    </section>
  );
}
