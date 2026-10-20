import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import Money from "@/components/Money";
import { ApiError } from "@/lib/api/base";
import { getServerLocale, getT } from "@/lib/i18n/server";
import { getProduct } from "@/features/market/api";
import { auctionEnded, availableOf, categoryName, fmtNum, isAuction, mediaOf, num } from "@/features/market/format";
import { norm } from "@/features/orders/status";
import ActionPanel from "@/features/market/detail/ActionPanel";
import AuctionBox from "@/features/market/detail/AuctionBox";
import SellerCard from "@/features/market/detail/SellerCard";
import dict from "@/features/market/detail/detail.i18n";
import Gallery from "@/features/market/detail/Gallery";
import unitsDict, { unitLabel } from "@/features/market/units.i18n";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  try {
    return await getProduct(id);
  } catch (e) {
    // 400 = malformed UUID, 404 = missing / sold / inactive
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props) {
  const [{ id }, t] = await Promise.all([params, getT(dict)]);
  try {
    const p = await getProduct(id);
    return { title: `${p.name} | ${t("brand")}`, description: p.description?.slice(0, 160) };
  } catch {
    return { title: t("brand") };
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const [p, t, tu, locale] = await Promise.all([load(id), getT(dict), getT(unitsDict), getServerLocale()]);

  const auction = isAuction(p);
  const ended = auctionEnded(p);
  const bid = num(p.currentBid);
  const start = num(p.auctionStartPrice);
  const price = auction ? (bid ?? start) : num(p.fixedPrice);
  const priceLabel = auction ? (bid !== null ? t("currentBid") : t("startPrice")) : t("pricePerUnit", { unit: unitLabel(tu, p.unit) });
  const available = availableOf(p);
  const category = categoryName(p.category, locale);

  // Deliberately not shown: driverName / driverPhone / merchantId come back on this public endpoint too.
  const facts = [
    { k: t("quantity"), v: `${fmtNum(available)} ${unitLabel(tu, p.unit)}` },
    { k: t("farm"), v: p.farm?.name },
    { k: t("category"), v: category },
    { k: t("delivery"), v: norm(p.deliveryMethod) === "DRIVER" ? t("driverDelivery") : norm(p.deliveryMethod) === "FROM_FARM" ? t("fromFarm") : null },
  ].filter((f): f is { k: string; v: string } => Boolean(f.v));

  return (
    <div className="wrap py-8 lg:py-12">
      <Link href="/market" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
        {t("back")}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <Gallery media={mediaOf(p)} alt={p.name} />

        <div className="space-y-8">
          <div>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-on-solid ${auction ? "bg-pomegranate" : "bg-grove"}`}>
              {auction ? t("auction") : t("fixed")}
            </span>
            <h1 className="mt-4 font-display text-3xl leading-snug font-bold text-balance sm:text-4xl">{p.name}</h1>
            {p.farm?.locationText && (
              <p className="mt-2 flex items-center gap-2 text-muted">
                <MapPin className="size-4" aria-hidden="true" />
                {p.farm.locationText}
              </p>
            )}
          </div>

          {auction ? (
            <AuctionBox id={p.id} merchantId={p.merchantId} unit={p.unit} available={available} startPrice={start} currentBid={bid} endAt={p.auctionEndAt ?? null} ended={ended} />
          ) : (
            <section className="rounded-2xl border border-line bg-surface p-6">
              <p className="text-sm text-muted">{priceLabel}</p>
              <Money value={price} className="font-display text-4xl font-bold text-grove sm:text-5xl" />
              <div className="mt-6 border-t border-line pt-6">
                <ActionPanel id={p.id} merchantId={p.merchantId} auction={false} unit={p.unit} available={available} unitPrice={price} floor={null} />
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-lg font-bold">{t("details")}</h2>
            <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {facts.map((f) => (
                <div key={f.k} className="flex justify-between gap-4 px-5 py-3.5 text-sm">
                  <dt className="text-muted">{f.k}</dt>
                  <dd className="font-medium">{f.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <SellerCard merchantId={p.merchantId} />

          {p.description && (
            <section>
              <h2 className="mb-2 font-display text-lg font-bold">{t("description")}</h2>
              <p className="max-w-prose leading-8 whitespace-pre-line text-muted">{p.description}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
