"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import PageNav from "@/components/page-nav/PageNav";
import EmptyState from "@/components/ui/EmptyState";
import QueryState from "@/components/ui/QueryState";
import StarRating from "@/components/stars/StarRating";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { fetchUserRatings, nameOf } from "@/features/ratings/ratings-api";
import { useAuthStore } from "@/stores/auth-store";
import dict from "./sellers.i18n";

/** The ratings endpoint is behind the login guard, so guests are invited to sign in instead. */
export default function SellerReviews({ userId }: { userId: string }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ["ratings", "user", userId, page], queryFn: () => fetchUserRatings(userId, page), enabled: hydrated && !!token, placeholderData: keepPreviousData });

  if (!hydrated) return <div className="h-24 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" aria-hidden="true" />;
  if (!token) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-8 text-center">
        <p className="text-muted">{t("loginToSee")}</p>
        <Link href={`/login?next=${encodeURIComponent(`/sellers/${userId}`)}`} className="btn btn-solid mt-4">
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <QueryState q={q} isEmpty={(d) => d.items.length === 0} empty={<EmptyState icon={Star} title={t("empty")} />}>
      {(d) => (
        <>
          <ul className="space-y-3">
            {d.items.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StarRating value={Number(r.score) || 0} />
                  <span className="text-sm text-muted">{fmtDate(r.createdAt, locale)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{t("from", { name: nameOf(r.reviewer) ?? t("anonymous") })}</p>
                {r.comment && <p className="mt-3 whitespace-pre-line">{r.comment}</p>}
              </li>
            ))}
          </ul>
          <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
        </>
      )}
    </QueryState>
  );
}
