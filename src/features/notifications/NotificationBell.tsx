"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useDismiss } from "@/components/popover/useDismiss";
import { timeAgo } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useAuthStore } from "@/stores/auth-store";
import dict from "./notifications.i18n";
import { useNotificationStream } from "./useNotificationStream";
import { fetchUnread, fetchUnreadCount, markAllRead, markRead, notifBody, notificationHref, notifTitle, type AppNotification } from "./notifications-api";

export default function NotificationBell() {
  const t = useT(dict);
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  useNotificationStream();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  const count = useQuery({ queryKey: ["notifications", "count"], queryFn: fetchUnreadCount, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const list = useQuery({ queryKey: ["notifications", "unread"], queryFn: fetchUnread, enabled: open });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["notifications"] });
  const read = useMutation({ mutationFn: markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: markAllRead, onSuccess: refresh });

  const unread = count.data ?? 0;

  function openItem(n: AppNotification) {
    read.mutate(n.id);
    setOpen(false);
    const href = notificationHref(n, role);
    if (href) router.push(href);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="notif-panel"
        aria-label={unread > 0 ? t("bellUnread", { n: unread }) : t("bell")}
        className="relative grid size-9 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-grove"
      >
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="figure absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-pomegranate px-1 text-[11px] leading-5 font-bold text-on-solid">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div id="notif-panel" className="absolute end-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-paper shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="font-display font-bold">{t("title")}</h2>
            {(list.data?.length ?? 0) > 0 && (
              <button type="button" onClick={() => readAll.mutate()} disabled={readAll.isPending} className="text-sm text-grove hover:underline disabled:opacity-60">
                {t("markAll")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {list.isPending ? (
              <p className="px-4 py-8 text-center text-sm text-muted">…</p>
            ) : list.isError ? (
              <div className="px-4 py-8 text-center text-sm">
                <p className="text-muted">{t("loadError")}</p>
                <button type="button" onClick={() => list.refetch()} className="mt-2 text-grove hover:underline">
                  {t("retry")}
                </button>
              </div>
            ) : list.data.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">{t("empty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.data.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => openItem(n)} className="flex w-full flex-col gap-1 px-4 py-3 text-start transition-colors hover:bg-grove-soft">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-medium">{notifTitle(n, locale)}</span>
                        <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt, locale)}</span>
                      </span>
                      <span className="line-clamp-2 text-sm text-muted">{notifBody(n, locale)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-medium text-grove hover:bg-grove-soft">
            {t("seeAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
