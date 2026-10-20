"use client";

import { useState } from "react";
import Alert from "@/components/Alert";
import PageNav from "@/components/page-nav/PageNav";
import Badge, { type Tone } from "@/components/ui/Badge";
import { FilterBar, SelectFilter } from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import StarRating from "@/components/stars/StarRating";
import { FLAG_STATUS } from "@/lib/enums";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { nameOf, type Rating } from "@/features/ratings/ratings-api";
import { norm } from "@/features/orders/status";
import adminDict from "../admin.i18n";
import { adminMutate, useAdminAction, useAdminList } from "../admin-api";
import ReasonDialog from "../ReasonDialog";
import dict from "./ratings.i18n";

interface Flag {
  id: string;
  reason?: string | null;
  notes?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt?: string;
  rating?: (Rating & { reviewer?: { fullName?: string | null } | null; reviewed?: { fullName?: string | null } | null }) | null;
  reporter?: { fullName?: string | null } | null;
}
type Decision = "DISMISSED" | "REVIEWED" | "REMOVED";
const TONE: Record<string, Tone> = { PENDING: "wait", REVIEWED: "go", DISMISSED: "stop", REMOVED: "done" };
const FLAG_KEYS = ["PENDING", "REVIEWED", "DISMISSED", "REMOVED"] as const;

export default function AdminRatings() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const { locale } = useLocale();
  const act = useAdminAction();
  const [tab, setTab] = useState<"flags" | "all">("flags");
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [deciding, setDeciding] = useState<{ flag: Flag; decision: Decision } | null>(null);

  // FLAG_STATUS must match the backend's FlagStatus values (lowercase: pending, reviewed, dismissed,
  // removed). The browser sends them as-is, and the list is read through norm(), which is case-blind.
  const flags = useAdminList<Flag>(
    "flags",
    "/ratings/flags",
    page,
    { status: status ? FLAG_STATUS[status as keyof typeof FLAG_STATUS] : undefined },
    tab === "flags",
  );
  const all = useAdminList<Rating>("all-ratings", "/ratings", page, {}, tab === "all");

  const tabBtn = (k: "flags" | "all", label: string) => (
    <button
      key={k}
      type="button"
      role="tab"
      aria-selected={tab === k}
      onClick={() => {
        setTab(k);
        setPage(1);
      }}
      className={`rounded-full px-5 py-2 text-sm transition-colors ${tab === k ? "bg-grove-soft font-medium text-grove ring-1 ring-grove/40" : "text-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );
  const copy = {
    DISMISSED: { title: t("dismissTitle"), body: t("dismissBody"), label: t("dismiss") },
    REVIEWED: { title: t("reviewedTitle"), body: t("reviewedBody"), label: t("markReviewed") },
    REMOVED: { title: t("removeTitle"), body: t("removeBody"), label: t("remove") },
  } as const;

  return (
    <div className="space-y-6">
      <PageHead title={t("title")} sub={t("sub")} />
      {act.error && <Alert tone="error">{act.error}</Alert>}
      <div role="tablist" className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
        {tabBtn("flags", t("tabFlags"))}
        {tabBtn("all", t("tabAll"))}
      </div>

      {tab === "flags" ? (
        <>
          <FilterBar>
            <SelectFilter
              label={t("status")}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[{ value: "", label: ta("all") }, ...FLAG_KEYS.map((s) => ({ value: s, label: t(s) }))]}
            />
          </FilterBar>
          <QueryState q={flags} isEmpty={(d) => d.items.length === 0} empty={<p className="py-8 text-center text-muted">{t("empty")}</p>}>
            {(d) => (
              <>
                <ul className="space-y-3">
                  {d.items.map((f) => {
                    const st = norm(f.status);
                    return (
                      <li key={f.id} className="rounded-2xl border border-line bg-surface p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge tone={TONE[st] ?? "wait"}>{st in TONE ? t(st as "PENDING") : f.status}</Badge>
                          <span className="text-sm text-muted">{fmtDate(f.createdAt, locale)}</span>
                        </div>
                        {f.rating && (
                          <div className="mt-3 rounded-xl border border-line bg-paper p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <StarRating value={Number(f.rating.score) || 0} size="size-4" />
                              <span className="text-xs text-muted">
                                {t("by", { a: nameOf(f.rating.reviewer) ?? "—", b: nameOf(f.rating.reviewed) ?? "—" })}
                              </span>
                            </div>
                            {f.rating.comment && <p className="mt-2 whitespace-pre-line text-sm">{f.rating.comment}</p>}
                          </div>
                        )}
                        <p className="mt-3 text-sm">
                          <span className="text-muted">{t("flagReason")}: </span>
                          {f.reason} {f.notes ? `— ${f.notes}` : ""}
                        </p>
                        <p className="text-sm text-muted">
                          {t("reporter")}: {nameOf(f.reporter) ?? "—"}
                        </p>
                        {f.adminNotes && (
                          <p className="mt-1 text-sm">
                            <span className="text-muted">{t("adminNotes")}: </span>
                            {f.adminNotes}
                          </p>
                        )}
                        {st === "PENDING" && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setDeciding({ flag: f, decision: "DISMISSED" })} className="btn btn-line h-9 px-4">
                              {t("dismiss")}
                            </button>
                            <button type="button" onClick={() => setDeciding({ flag: f, decision: "REVIEWED" })} className="btn btn-line h-9 px-4">
                              {t("markReviewed")}
                            </button>
                            <button type="button" onClick={() => setDeciding({ flag: f, decision: "REMOVED" })} className="btn btn-line h-9 px-4 text-pomegranate">
                              {t("remove")}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
              </>
            )}
          </QueryState>
        </>
      ) : (
        <QueryState q={all} isEmpty={(d) => d.items.length === 0} empty={<p className="py-8 text-center text-muted">{t("emptyRatings")}</p>}>
          {(d) => (
            <>
              <ul className="space-y-3">
                {d.items.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StarRating value={Number(r.score) || 0} size="size-4" />
                      <span className="text-sm text-muted">{fmtDate(r.createdAt, locale)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{t("by", { a: nameOf(r.reviewer) ?? "—", b: nameOf(r.reviewed) ?? "—" })}</p>
                    {r.comment && <p className="mt-2 whitespace-pre-line text-sm">{r.comment}</p>}
                  </li>
                ))}
              </ul>
              <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
            </>
          )}
        </QueryState>
      )}

      <ReasonDialog
        open={!!deciding}
        title={deciding ? copy[deciding.decision].title : ""}
        body={deciding ? copy[deciding.decision].body : undefined}
        confirmLabel={deciding ? copy[deciding.decision].label : ""}
        danger={deciding?.decision === "REMOVED"}
        busy={act.busy}
        onConfirm={async (note) => {
          if (!deciding) return;
          // ReviewFlagDto: status (REVIEWED | DISMISSED | REMOVED), adminNotes ≤ 500. The server rejects PENDING.
          const ok = await act.run(() =>
            adminMutate("PATCH", `/ratings/flags/${deciding.flag.id}`, {
              status: FLAG_STATUS[deciding.decision],
              adminNotes: note || undefined,
            }),
          );
          if (ok) setDeciding(null);
        }}
        onClose={() => !act.busy && setDeciding(null)}
      />
    </div>
  );
}
