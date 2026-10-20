"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { connectNamespace } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";

export interface BidUpdate {
  bidId?: string;
  amount?: number;
  totalBids?: number;
  /** present (possibly null) when a bid was withdrawn */
  currentBid?: number | null;
}

/**
 * Joins `auction:<id>` on the /auctions namespace. Returns whether the socket is currently connected.
 * The server only lets signed-in users join, so nothing connects without a token.
 */
export function useAuctionSocket(
  productId: string,
  enabled: boolean,
  h: { onBid: (u: BidUpdate) => void; onClosed: () => void }
) {
  const handlers = useRef(h);
  useEffect(() => {
    handlers.current = h;
  });
  const token = useAuthStore((s) => s.accessToken);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!enabled || !token) return;
    const socket = connectNamespace(
      "/auctions",
      () => useAuthStore.getState().accessToken
    );

    socket.on("connect", () => {
      setLive(true);
      socket.emit("join_auction", { productId });
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("bid_update", (u: BidUpdate & { productId?: string }) => {
      if (!u.productId || u.productId === productId) handlers.current.onBid(u);
    });
    socket.on("auction_closed", () => handlers.current.onClosed());

    // Expired token: the server disconnects and won't retry. Any API call refreshes it,
    // the store's token changes, and this effect reconnects with the new one.
    socket.on("auth_error", () => {
      void apiGet("/notifications/unread/count").catch(() => undefined);
    });
    socket.on("exception", (e: unknown) => console.warn("[auction socket]", e));
    socket.on("connect_error", (e: Error) =>
      console.warn("[auction socket] connect_error:", e.message)
    );

    return () => {
      socket.emit("leave_auction", { productId });
      socket.disconnect();
      setLive(false);
    };
  }, [productId, enabled, token]);

  return live;
}
