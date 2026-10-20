"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, Play } from "lucide-react";
import Alert from "@/components/Alert";
import QueryState from "@/components/ui/QueryState";
import { cld } from "@/lib/cloudinary";
import { useT } from "@/lib/i18n/LocaleProvider";
import FarmStatusBadge from "@/features/merchant/farms/FarmStatusBadge";
import {
  documentAssets,
  farmMedia,
  type Farm,
} from "@/features/merchant/farms/farms-types";
import {
  adminGet,
  unwrapData,
  useAdminAction,
  useAdminQuery,
} from "../admin-api";
import FarmActions from "./FarmActions";
import dict from "./farms.i18n";

type Detail = Farm & {
  owner?: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};
type DocRow = {
  id: string;
  url: string | null;
  createdAt?: string;
  expiresAt?: string | null;
};

export default function AdminFarmDetail({ id }: { id: string }) {
  const t = useT(dict);
  const router = useRouter();
  const act = useAdminAction();
  const q = useAdminQuery<Detail>("farm", `/farms/${id}`);
  // Links expire after 5 minutes. Refetching every 4 minutes, and when the window regains focus, keeps
  // the link on screen usable.
  const docs = useQuery({
    queryKey: ["admin", "farm-docs", id],
    queryFn: async () =>
      unwrapData<DocRow[]>(await adminGet<unknown>(`/farms/${id}/documents`)),
    refetchInterval: 4 * 60_000,
    refetchOnWindowFocus: true,
  });

  return (
    <div>
      <Link
        href="/admin/farms"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
        {t("back")}
      </Link>
      {act.error && (
        <div className="mb-6">
          <Alert tone="error">{act.error}</Alert>
        </div>
      )}
      <QueryState q={q}>
        {(f) => {
          const rows: [string, string | null | undefined][] = [
            [t("manager"), f.managerName],
            [t("phone"), f.contactPhone],
            [t("colLocation"), f.locationText],
            [t("registry"), f.agRegistryNo],
            [
              t("coords"),
              f.latitude != null && f.longitude != null
                ? `${f.latitude}, ${f.longitude}`
                : null,
            ],
            [
              t("owner"),
              f.owner
                ? [f.owner.fullName, f.owner.email, f.owner.phone]
                    .filter(Boolean)
                    .join(" · ")
                : null,
            ],
          ];
          return (
            <div className="space-y-10">
              <header className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-bold">
                  {f.displayName || f.name}
                </h1>
                <FarmStatusBadge status={f.status} />
              </header>
              <FarmActions
                id={f.id}
                status={f.status}
                run={act.run}
                busy={act.busy}
                onDeleted={() => router.replace("/admin/farms")}
              />

              {f.rejectionReason && (
                <p className="rounded-lg border border-line border-s-4 border-s-pomegranate bg-surface p-4 text-sm">
                  <span className="text-muted">{t("reasonShown")}: </span>
                  {f.rejectionReason}
                </p>
              )}

              <section className="max-w-2xl">
                <h2 className="mb-3 font-display text-lg font-bold">
                  {t("info")}
                </h2>
                <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
                  {rows
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between gap-4 px-5 py-3 text-sm"
                      >
                        <dt className="text-muted">{k}</dt>
                        <dd className="text-end font-medium">{v}</dd>
                      </div>
                    ))}
                </dl>
              </section>

              <section>
                <h2 className="mb-3 font-display text-lg font-bold">
                  {t("media")}
                </h2>
                {farmMedia(f).length === 0 ? (
                  <p className="text-sm text-muted">{t("noFiles")}</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {farmMedia(f).map((a) => (
                      <li
                        key={a.id}
                        className="aspect-square overflow-hidden rounded-xl border border-line bg-grove-soft"
                      >
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="grid size-full place-items-center"
                        >
                          {a.kind === "video" ? (
                            <Play
                              className="size-8 text-grove"
                              aria-hidden="true"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
                            <img
                              src={cld(a.url, 300)}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-3 font-display text-lg font-bold">
                  {t("docs")}
                </h2>
                <QueryState
                  q={docs}
                  isEmpty={(d) => documentAssets(d).length === 0}
                  empty={<p className="text-sm text-muted">{t("noFiles")}</p>}
                  skeleton={
                    <div className="h-12 animate-pulse rounded-xl bg-line/60 motion-reduce:animate-none" />
                  }
                >
                  {(d) => (
                    <ul className="space-y-2">
                      {documentAssets(d).map((a, i) => (
                        <li key={a.id}>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-grove"
                          >
                            <FileText
                              className="size-4 text-grove"
                              aria-hidden="true"
                            />
                            {a.name ?? `${t("docs")} ${i + 1}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </QueryState>
              </section>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
