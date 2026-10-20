import Money from "@/components/Money";
import { getT } from "@/lib/i18n/server";
import dict from "./merchants.i18n";

const HOLD_DAYS = 3; // backend default (WALLET_HOLD_DAYS) — wire to the API later

export default async function Merchants() {
  const t = await getT(dict);
  const points = [
    ["p1", "p1d"],
    ["p2", "p2d"],
    ["p3", "p3d"],
  ] as const;

  return (
    <section id="merchants" className="wrap grid gap-12 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
      <div>
        <h2 className="font-display text-3xl leading-snug font-bold text-balance sm:text-4xl">{t("title")}</h2>
        <p className="mt-4 max-w-md text-muted">{t("body")}</p>
        <ul className="mt-10 space-y-6">
          {points.map(([p, d]) => (
            <li key={p} className="border-s-2 border-grove ps-5">
              <h3 className="font-bold">{t(p)}</h3>
              <p className="mt-1 text-muted">{t(d)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="self-start rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-display text-lg font-bold">{t("wallet")}</h3>
          <span className="text-xs text-muted">{t("sample")}</span>
        </div>
        <dl className="divide-y divide-line">
          <div className="px-6 py-5">
            <dt className="flex items-center gap-2 text-sm text-muted">
              <span className="size-2.5 rounded-sm bg-grove" aria-hidden="true" />
              {t("available")}
            </dt>
            <dd className="mt-1 font-display text-4xl font-bold text-grove">
              <Money value={1840} />
            </dd>
          </div>
          <div className="px-6 py-5">
            <dt className="flex items-center gap-2 text-sm text-muted">
              <span className="size-2.5 rounded-sm bg-oil" aria-hidden="true" />
              {t("pending")}
            </dt>
            <dd className="mt-1 font-display text-2xl font-bold text-oil">
              <Money value={620} />
            </dd>
            <dd className="mt-1 text-sm text-muted">{t("pendingNote", { days: HOLD_DAYS })}</dd>
          </div>
          <div className="px-6 py-5">
            <dt className="text-sm text-muted">{t("total")}</dt>
            <dd className="mt-1 text-xl font-bold">
              <Money value={9275} />
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
