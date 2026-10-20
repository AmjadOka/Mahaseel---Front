"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Countdown from "@/components/countdown/Countdown";
import Money from "@/components/Money";
import { useT } from "@/lib/i18n/LocaleProvider";
import { num } from "../format";
import ActionPanel from "./ActionPanel";
import dict from "./detail.i18n";
import { useAuctionSocket } from "./useAuctionSocket";

type Props = {
  id: string;
  merchantId?: string;
  unit: string;
  available: number;
  startPrice: number | null;
  currentBid: number | null;
  endAt: string | null;
  ended: boolean;
};

/** The auction's price block, kept live over Socket.IO, with the bid form beneath it. */
export default function AuctionBox({
  id,
  merchantId,
  unit,
  available,
  startPrice,
  currentBid,
  endAt,
  ended,
}: Props) {
  const t = useT(dict);
  const [bid, setBid] = useState(currentBid);
  const [total, setTotal] = useState<number | null>(null);
  const [closed, setClosed] = useState(ended);

  const live = useAuctionSocket(id, !closed, {
    onBid: (u) => {
      // Socket values can arrive as strings, so each one is normalised to a number.
      if (u.currentBid !== undefined)
        setBid(num(u.currentBid)); // a withdrawal can fall back to null
      else if (u.amount !== undefined) setBid(num(u.amount));
      if (u.totalBids !== undefined) setTotal(num(u.totalBids));
    },
    onClosed: () => setClosed(true),
  });

  // The server closes the auction when it ends, but its event can arrive late. The clock is checked too.
  // This polls rather than using a timer: setTimeout overflows past about 24.8 days.
  useEffect(() => {
    if (closed || !endAt) return;
    const end = new Date(endAt).getTime();
    const check = () => {
      if (Date.now() >= end) setClosed(true);
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [endAt, closed]);

  const shown = bid ?? startPrice;

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {bid !== null ? t("currentBid") : t("startPrice")}
        </p>
        {live && (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-pomegranate">
            <span
              className="size-2 rounded-full bg-pomegranate motion-safe:animate-pulse"
              aria-hidden="true"
            />
            {t("live")}
          </span>
        )}
      </div>
      <p
        key={shown ?? "none"}
        className="font-display text-4xl font-bold text-pomegranate motion-safe:animate-bump sm:text-5xl"
      >
        <Money value={shown} />
      </p>
      <p className="mt-2 text-sm text-muted">
        {bid !== null && startPrice !== null && (
          <>
            {t("startPrice")}: <Money value={startPrice} className="text-ink" />
          </>
        )}
        {total !== null && total > 0 && (
          <span className="ms-3">{t("bidsCount", { n: total })}</span>
        )}
      </p>

      {endAt && (
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-pomegranate">
          <Clock className="size-4" aria-hidden="true" />
          {closed ? (
            <span className="font-medium">{t("ended")}</span>
          ) : (
            <>
              <span className="text-sm">{t("endsIn")}</span>
              <Countdown endAt={endAt} className="font-medium" />
            </>
          )}
        </div>
      )}

      {!closed && (
        <div className="mt-6 border-t border-line pt-6">
          <ActionPanel
            id={id}
            merchantId={merchantId}
            auction
            unit={unit}
            available={available}
            unitPrice={null}
            floor={shown}
            // A current bid must be beaten. Without one, the first bid may equal the start price.
            floorStrict={bid !== null}
            onBidPlaced={(n) => setBid(n)}
          />
        </div>
      )}
    </section>
  );
}
