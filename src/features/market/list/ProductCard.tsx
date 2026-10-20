import Link from "next/link";
import { Clock, MapPin, Sprout } from "lucide-react";
import Countdown from "@/components/countdown/Countdown";
import Money from "@/components/Money";
import { cld } from "@/lib/cloudinary";
import { getServerLocale, getT } from "@/lib/i18n/server";
import { categoryName, coverOf, fmtNum, isAuction, num } from "../format";
import type { Product } from "../types";
import unitsDict, { unitLabel } from "../units.i18n";
import dict from "./card.i18n";

export default async function ProductCard({ product: p }: { product: Product }) {
  const [t, tu, locale] = await Promise.all([getT(dict), getT(unitsDict), getServerLocale()]);
  const img = coverOf(p);
  const auction = isAuction(p);
  const bid = num(p.currentBid);
  const priceLabel = auction ? (bid !== null ? t("currentBid") : t("startPrice")) : t("pricePerUnit", { unit: unitLabel(tu, p.unit) });
  const price = auction ? (bid ?? num(p.auctionStartPrice)) : num(p.fixedPrice);
  const category = categoryName(p.category, locale);
  const place = p.farm?.locationText; // the list endpoint doesn't join farm columns yet — shows once it does

  return (
    <Link
      href={`/market/${p.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-grove"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-grove-soft">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized, auto-format images
          <img
            src={cld(img, 640)}
            alt={p.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div className="grid size-full place-items-center text-grove/40">
            <Sprout className="size-10" aria-hidden="true" />
          </div>
        )}
        <span className={`absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-medium text-on-solid ${auction ? "bg-pomegranate" : "bg-grove"}`}>
          {auction ? t("auction") : t("fixed")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="line-clamp-1 font-display text-lg font-bold">{p.name}</h3>
          {(category || place) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
              {category && <span>{category}</span>}
              {place && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {place}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{priceLabel}</p>
            <Money value={price} className={`text-xl font-bold ${auction ? "text-pomegranate" : "text-grove"}`} />
          </div>
          <p className="text-sm text-muted">
            <span className="figure">{fmtNum(num(p.availableQuantity) ?? num(p.quantity) ?? 0)}</span> {unitLabel(tu, p.unit)}
          </p>
        </div>

        {auction && p.auctionEndAt && (
          <div className="flex items-center gap-2 border-t border-line pt-3 text-sm text-pomegranate">
            <Clock className="size-3.5" aria-hidden="true" />
            <Countdown endAt={p.auctionEndAt} />
          </div>
        )}
      </div>
    </Link>
  );
}
