import { isObj } from "@/lib/api/base";
import { API_BASE, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizePage } from "@/lib/api/paginate";
import type { Locale } from "@/lib/i18n/locale";

export interface AppNotification {
  id: string;
  type?: string;
  title?: string | null;
  body?: string | null;
  titleAr?: string | null;
  bodyAr?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt?: string;
  isRead?: boolean;
}

/** One pushed event from the live stream. `count` is the unread total after this event. */
export interface LiveNotification {
  count: number;
  type?: string;
  title?: string;
  body?: string;
  titleAr?: string;
  bodyAr?: string;
  referenceType?: string;
  referenceId?: string;
}

/** `GET /notifications/unread/count` returns a bare number. The wrapped forms are a fallback. */
export async function fetchUnreadCount(): Promise<number> {
  const r = await apiGet<unknown>("/notifications/unread/count");
  const v = isObj(r) ? (isObj(r.data) ? (r.data.count ?? r.data.unread) : (r.data ?? r.count ?? r.unread)) : r;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** `GET /notifications/unread` returns a bare array. */
export async function fetchUnread(): Promise<AppNotification[]> {
  const r = await apiGet<unknown>("/notifications/unread", { limit: 10 });
  const list = Array.isArray(r) ? r : isObj(r) ? (Array.isArray(r.items) ? r.items : Array.isArray(r.data) ? r.data : []) : [];
  return list as AppNotification[];
}

export const markRead = (id: string) => apiPatch(`/notifications/${id}/read`);
export const markAllRead = () => apiPatch("/notifications/read-all");

const clean = (s: string | null | undefined) => (s ?? "").replace(/https?:\/\/\S+/g, "").trim(); // payment links live on the order page
/** Many notifications carry only Arabic text (`title: ''`), so fall back across languages. */
export const notifTitle = (n: AppNotification, locale: Locale) => clean(locale === "ar" ? n.titleAr || n.title : n.title || n.titleAr);
export const notifBody = (n: AppNotification, locale: Locale) => clean(locale === "ar" ? n.bodyAr || n.body : n.body || n.bodyAr);

export const NOTIFICATIONS_PAGE_SIZE = 20;

/** `GET /notifications` returns { items, meta }, the same shape as every other list. */
export const fetchNotifications = async (page: number) =>
  normalizePage<AppNotification>(await apiGet<unknown>("/notifications", { page, limit: NOTIFICATIONS_PAGE_SIZE }), page, NOTIFICATIONS_PAGE_SIZE);

/** Where a notification leads, by who is reading it. */
export function notificationHref(n: AppNotification, role?: string): string | null {
  if (n.type?.startsWith("account_")) return "/account"; // promotion and suspension notices
  const id = n.referenceId;
  if (!id) return null;
  if (n.referenceType === "order") return role === "MERCHANT" ? "/merchant/orders" : role === "BUYER" ? `/orders/${id}` : null;
  if (n.referenceType === "product") return role === "MERCHANT" ? `/merchant/products/${id}/bids` : `/market/${id}`;
  if (n.referenceType === "farm") return role === "MERCHANT" ? `/merchant/farms/${id}` : null;
  if (n.referenceType === "rating" || n.referenceType === "flag") return "/ratings";
  if (n.referenceType === "withdrawal") return role === "MERCHANT" ? "/merchant/wallet" : null;
  return null;
}

/**
 * Live notifications over SSE. EventSource can't send an Authorization header, so the
 * browser first asks for a single-use ticket (valid 60 s) with its token, then opens the
 * stream with the ticket in the URL. The token never appears in a URL.
 *
 * On error the stream closes and reopens after a back-off with a fresh ticket. Heartbeats
 * are typed "heartbeat" and don't reach onmessage.
 *
 * Returns a function that stops the stream.
 */
export function openNotificationStream(onNotification: (n: LiveNotification) => void): () => void {
  let es: EventSource | null = null;
  let stopped = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if (stopped) return;
    attempt += 1;
    timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5)));
  };

  const connect = async () => {
    if (stopped) return;
    try {
      const r = await apiPost<unknown>("/notifications/stream-ticket");
      const ticket = isObj(r) && typeof r.ticket === "string" ? r.ticket : isObj(r) && isObj(r.data) && typeof r.data.ticket === "string" ? r.data.ticket : null;
      if (!ticket) throw new Error("No stream ticket");
      if (stopped) return;

      es = new EventSource(`${API_BASE}/notifications/stream?ticket=${encodeURIComponent(ticket)}`);
      es.onmessage = (e) => {
        attempt = 0;
        try {
          onNotification(JSON.parse(e.data) as LiveNotification);
        } catch {
          // A malformed event is dropped. The next fetch of the unread count corrects the badge.
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        schedule();
      };
    } catch {
      schedule();
    }
  };

  void connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    es?.close();
    es = null;
  };
}
