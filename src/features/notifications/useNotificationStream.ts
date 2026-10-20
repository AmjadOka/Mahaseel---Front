"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { API_BASE, isObj } from "@/lib/api/base";
import { apiPost } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

interface Payload {
  count?: number;
  referenceType?: string;
}

/** Tickets are single-use (60 s TTL), so every (re)connect needs a fresh one. */
async function getTicket(): Promise<string> {
  const r = await apiPost<unknown>("/notifications/stream-ticket");
  const body = isObj(r) && isObj(r.data) ? r.data : r;
  const ticket = isObj(body) ? body.ticket : undefined;
  if (typeof ticket !== "string" || !ticket) throw new Error("no stream ticket");
  return ticket;
}

/**
 * Parses one SSE frame. Returns the payload only for a default "message" event with data.
 * Comments (`:ping`), named events such as "heartbeat", and empty frames return null.
 * The old parser read any data line, so each heartbeat looked like a notification and
 * triggered a refetch of every notification query.
 */
function payloadOf(frame: string): Payload | null {
  let event = "message";
  const data: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (event !== "message" || data.length === 0) return null;
  try {
    const v: unknown = JSON.parse(data.join("\n"));
    return isObj(v) ? (v as Payload) : null;
  } catch {
    return null;
  }
}

function onPayload(qc: QueryClient, p: Payload) {
  if (typeof p.count === "number") qc.setQueryData(["notifications", "count"], p.count);
  void qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
  void qc.invalidateQueries({ queryKey: ["notifications", "page"] });
  if (p.referenceType === "order") {
    void qc.invalidateQueries({ queryKey: ["orders"] });
    void qc.invalidateQueries({ queryKey: ["order"] });
    void qc.invalidateQueries({ queryKey: ["merchant-orders"] });
  }
  if (p.referenceType === "withdrawal") void qc.invalidateQueries({ queryKey: ["wallet"] });
}

/** Opens the stream and keeps it open, reconnecting with backoff. Returns a function that stops it. */
function startStream(qc: QueryClient): () => void {
  const ctrl = new AbortController();
  let stopped = false;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  (async () => {
    let delay = 2_000;
    while (!stopped) {
      try {
        const ticket = await getTicket();
        const res = await fetch(`${API_BASE}/notifications/stream?ticket=${encodeURIComponent(ticket)}`, {
          headers: { Accept: "text/event-stream" },
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(String(res.status));
        delay = 2_000;

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value.replace(/\r\n/g, "\n");
          let i: number;
          while ((i = buf.indexOf("\n\n")) >= 0) {
            const frame = buf.slice(0, i);
            buf = buf.slice(i + 2);
            const p = payloadOf(frame);
            if (p) onPayload(qc, p);
          }
        }
      } catch {
        if (stopped) return;
      }
      await sleep(delay);
      delay = Math.min(delay * 2, 60_000);
    }
  })();

  return () => {
    stopped = true;
    ctrl.abort();
  };
}

// The bell can mount more than once (desktop and mobile headers), and each mount called the
// hook. Every mount used to open its own stream. Now one shared stream runs while at least one
// component is mounted, and it stops when the last one unmounts.
let consumers = 0;
let stopShared: (() => void) | null = null;

/**
 * Live notifications. Gets a single-use ticket with the Bearer token, then opens the stream
 * with the ticket in the URL. The bell's 60 s polling is the fallback if the stream never
 * connects.
 */
export function useNotificationStream() {
  const qc = useQueryClient();
  // Depends on signed-in state only, not the token itself. A token refresh doesn't restart the stream.
  const signedIn = useAuthStore((s) => !!s.accessToken);

  useEffect(() => {
    if (!signedIn) return;
    consumers += 1;
    if (consumers === 1) stopShared = startStream(qc);
    return () => {
      consumers -= 1;
      if (consumers === 0) {
        stopShared?.();
        stopShared = null;
      }
    };
  }, [signedIn, qc]);
}
