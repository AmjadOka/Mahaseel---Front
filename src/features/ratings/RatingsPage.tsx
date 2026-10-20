"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import PageNav from "@/components/page-nav/PageNav";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StarRating from "@/components/stars/StarRating";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useRequireAuth } from "@/features/auth/useRequireAuth";
import dict from "./ratings.i18n";
import { EditRatingDialog, FlagRatingDialog } from "./RatingDialogs";
import { fetchRatings, nameOf, type Rating } from "./ratings-api";

export default function RatingsPage() {
  const ready = useRequireAuth();
  const t = useT(dict);
  const { locale } = useLocale();
  const [kind, setKind] = useState<"received" | "given">("received");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Rating | null>(null);
  const [flagging, setFlagging] = useState<Rating | null>(null);

  const q = useQuery({ queryKey: ["ratings", kind, page], queryFn: () => fetchRatings(kind, page), enabled: ready, placeholderData: keepPreviousData });

  const tab = (k: "received" | "given") => (
    <button
      key={k}
      type="button"
      role="tab"
      aria-selected={kind === k}
      onClick={() => {
        setKind(k);
        setPage(1);
      }}
      className={`rounded-full px-5 py-2 text-sm transition-colors ${kind === k ? "bg-grove-soft font-medium text-grove ring-1 ring-grove/40" : "text-muted hover:text-ink"}`}
    >
      {t(k)}
    </button>
  );

  return (
    <div className="wrap py-10 lg:py-14">
      <PageHead title={t("title")} sub={t("sub")} />
      <div role="tablist" className="mb-6 inline-flex gap-1 rounded-full border border-line bg-surface p-1">
        {tab("received")}
        {tab("given")}
      </div>

      {ready && (
        <QueryState q={q} isEmpty={(d) => d.items.length === 0} empty={<EmptyState icon={Star} title={t("empty")} />}>
          {(d) => (
            <>
              <ul className="space-y-3">
                {d.items.map((r) => {
                  const other = nameOf(kind === "received" ? r.reviewer : r.reviewed) ?? t("anonymous");
                  return (
                    <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StarRating value={Number(r.score) || 0} />
                        <span className="text-sm text-muted">{fmtDate(r.createdAt, locale)}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted">{kind === "received" ? t("from", { name: other }) : t("to", { name: other })}</p>
                      {r.comment && <p className="mt-3 whitespace-pre-line">{r.comment}</p>}
                      <div className="mt-4 flex gap-2">
                        {kind === "given" ? (
                          <button type="button" onClick={() => setEditing(r)} className="btn btn-line h-9 px-4">
                            {t("edit")}
                          </button>
                        ) : (
                          <button type="button" onClick={() => setFlagging(r)} className="btn btn-line h-9 px-4 text-pomegranate">
                            {t("report")}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
            </>
          )}
        </QueryState>
      )}

      <EditRatingDialog rating={editing} onClose={() => setEditing(null)} />
      <FlagRatingDialog rating={flagging} onClose={() => setFlagging(null)} />
    </div>
  );
}
