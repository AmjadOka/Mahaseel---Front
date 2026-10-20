"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Tractor } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { useT } from "@/lib/i18n/LocaleProvider";
import FarmStatusBadge from "./FarmStatusBadge";
import dict from "./farms.i18n";
import { fetchFarms } from "./farms-api";

export default function FarmsList() {
  const t = useT(dict);
  const q = useQuery({ queryKey: ["farms"], queryFn: fetchFarms });
  const add = (
    <Link href="/merchant/farms/new" className="btn btn-solid">
      {t("add")}
    </Link>
  );

  return (
    <div>
      <PageHead title={t("title")} sub={t("sub")} action={add} />
      <QueryState q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={Tractor} title={t("empty")} hint={t("emptyHint")} action={add} />}>
        {(farms) => (
          <ul className="grid gap-4 sm:grid-cols-2">
            {farms.map((f) => (
              <li key={f.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{f.displayName || f.name}</h2>
                  <FarmStatusBadge status={f.status} />
                </div>
                {f.locationText && (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <MapPin className="size-4" aria-hidden="true" />
                    {f.locationText}
                  </p>
                )}
                {f.managerName && (
                  <p className="text-sm text-muted">
                    {t("manager")}: {f.managerName}
                  </p>
                )}
                {f.rejectionReason && (
                  <p className="rounded-lg border border-line border-s-4 border-s-pomegranate bg-paper p-3 text-sm">
                    <span className="text-muted">{t("reason")}: </span>
                    {f.rejectionReason}
                  </p>
                )}
                <Link href={`/merchant/farms/${f.id}`} className="btn btn-line mt-auto h-10 self-start">
                  {t("edit")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
