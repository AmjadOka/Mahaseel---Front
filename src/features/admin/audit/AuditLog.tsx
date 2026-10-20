"use client";

import { useState } from "react";
import Dialog from "@/components/dialog/Dialog";
import PageNav from "@/components/page-nav/PageNav";
import DataTable from "@/components/ui/DataTable";
import { FilterBar, SearchFilter, SelectFilter, TextFilter } from "@/components/ui/FilterControls";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { fmtDate } from "@/lib/format-date";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import adminDict from "../admin.i18n";
import { dayEnd, dayStart, useAdminList, useAdminQuery } from "../admin-api";
import dict from "./audit.i18n";

interface Entry {
  id: string;
  adminId: string;
  adminPhone?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  reason?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}
const TYPES = ["user", "farm", "order", "product", "withdrawal", "notification"] as const;

function History({ type, id }: { type: string; id: string }) {
  const { locale } = useLocale();
  const q = useAdminQuery<Entry[]>("audit-history", `/admin/audit/${type}/${id}`);
  return (
    <QueryState q={q} skeleton={<div className="h-24 animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none" />}>
      {(rows) => (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li key={e.id} className="rounded-xl border border-line p-3 text-sm">
              <p className="font-medium">{e.action}</p>
              <p className="text-xs text-muted">{fmtDate(e.createdAt, locale)} · {e.adminPhone ?? e.adminId.slice(0, 8)}</p>
              {e.reason && <p className="mt-1">{e.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}

export default function AuditLog() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const { locale } = useLocale();
  const [type, setType] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<Entry | null>(null);

  const q = useAdminList<Entry>("audit", "/admin/audit", page, { resourceType: type, action, from: dayStart(from), to: dayEnd(to) });
  const reset = (f: () => void) => {
    f();
    setPage(1);
  };

  return (
    <div>
      <PageHead title={t("title")} sub={t("sub")} />
      <FilterBar>
        <SelectFilter label={t("resource")} value={type} onChange={(v) => reset(() => setType(v))} options={[{ value: "", label: ta("all") }, ...TYPES.map((r) => ({ value: r, label: t(`r_${r}` as "r_user") }))]} />
        <SearchFilter label={t("action")} buttonLabel={ta("search")} placeholder={t("actionPlaceholder")} onSearch={(v) => reset(() => setAction(v.toUpperCase()))} />
        <TextFilter label={ta("from")} type="date" value={from} onChange={(v) => reset(() => setFrom(v))} />
        <TextFilter label={ta("to")} type="date" value={to} onChange={(v) => reset(() => setTo(v))} />
      </FilterBar>

      <QueryState q={q} isEmpty={(d) => d.items.length === 0} empty={<p className="py-8 text-center text-muted">{ta("empty")}</p>}>
        {(d) => (
          <>
            <DataTable
              caption={t("title")}
              rows={d.items}
              rowKey={(e) => e.id}
              columns={[
                { key: "w", header: t("colWhen"), cell: (e) => <span className="whitespace-nowrap">{fmtDate(e.createdAt, locale)}</span> },
                { key: "a", header: t("colAdmin"), cell: (e) => <span className="figure">{e.adminPhone ?? e.adminId.slice(0, 8)}</span> },
                { key: "x", header: t("colAction"), cell: (e) => <code className="rounded bg-grove-soft px-2 py-0.5 text-xs">{e.action}</code> },
                {
                  key: "r",
                  header: t("colResource"),
                  cell: (e) =>
                    e.resourceId ? (
                      <button type="button" onClick={() => setHistory(e)} className="text-start text-grove hover:underline" title={t("history")}>
                        {e.resourceType} <span className="figure text-xs text-muted">{e.resourceId.slice(0, 8)}</span>
                      </button>
                    ) : (
                      e.resourceType
                    ),
                },
                { key: "n", header: t("colReason"), cell: (e) => e.reason ?? "—" },
                { key: "m", header: t("meta"), cell: (e) => (e.meta && Object.keys(e.meta).length ? (<details><summary className="cursor-pointer text-xs text-grove">{t("meta")}</summary><pre className="figure mt-2 max-w-xs overflow-x-auto rounded-lg bg-paper p-2 text-xs">{JSON.stringify(e.meta, null, 1)}</pre></details>) : "—") },
              ]}
            />
            <PageNav page={d.page} totalPages={d.totalPages} onPage={setPage} />
          </>
        )}
      </QueryState>

      <Dialog open={!!history} title={t("historyTitle")} onClose={() => setHistory(null)} wide>
        {history?.resourceId && <History type={history.resourceType} id={history.resourceId} />}
      </Dialog>
    </div>
  );
}
