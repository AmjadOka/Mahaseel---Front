"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import PageNav from "@/components/page-nav/PageNav";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { timeAgo } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import { useMe } from "@/features/auth/useMe";
import dict from "./notifications.i18n";
import { fetchNotifications, markAllRead, markRead, notifBody, notificationHref, notifTitle, type AppNotification } from "./notifications-api";

export default function NotificationsPage() {
  const ready = useRequireAuth();
  const t = useT(dict);
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useMe();
  const [page, setPage] = useState(1);

  const q = useQuery({ queryKey: ["notifications", "page", page], queryFn: () => fetchNotifications(page), enabled: ready, placeholderData: keepPreviousData });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["notifications"] });
  const read = useMutation({ mutationFn: markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: markAllRead, onSuccess: refresh });

  function open(n: AppNotification) {
    if (!n.isRead) read.mutate(n.id);
    const href = notificationHref(n, user?.role);
    if (href) router.push(href);
  }

  const hasUnread = q.data?.items.some((n) => !n.isRead);

  return (
    <div className="wrap py-10 lg:py-14">
      <PageHead
        title={t("pageTitle")}
        sub={t("pageSub")}
        action={
          hasUnread ? (
            <button type="button" onClick={() => readAll.mutate()} disabled={readAll.isPending} className="btn btn-line">
              {t("markAll")}
            </button>
          ) : undefined
        }
      />
      {ready && (
        <QueryState q={q} isEmpty={(d) => d.items.length === 0} empty={<EmptyState icon={Bell} title={t("pageEmpty")} />}>
          {(d) => (
            <>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {d.items.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => open(n)} className={`flex w-full gap-3 px-5 py-4 text-start transition-colors hover:bg-grove-soft ${n.isRead ? "" : "bg-grove-soft/40"}`}>
                      <span className={`mt-2 size-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-pomegranate"}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className={n.isRead ? "" : "font-bold"}>{notifTitle(n, locale)}</span>
                          <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt, locale)}</span>
                        </span>
                        <span className="mt-1 block text-sm text-muted">{notifBody(n, locale)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
            </>
          )}
        </QueryState>
      )}
    </div>
  );
}
