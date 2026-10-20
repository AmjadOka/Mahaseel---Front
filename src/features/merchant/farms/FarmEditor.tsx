"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import AssetManager from "@/components/asset-manager/AssetManager";
import QueryState from "@/components/ui/QueryState";
import { useT } from "@/lib/i18n/LocaleProvider";
import FarmForm from "./FarmForm";
import FarmStatusBadge from "./FarmStatusBadge";
import dict from "./farms.i18n";
import {
  deleteFarmDocument,
  deleteFarmMedia,
  fetchFarm,
  fetchFarmDocuments,
  uploadFarmDocuments,
  uploadFarmMedia,
} from "./farms-api";
import { documentAssets, farmMedia } from "./types";

export function BackToFarms() {
  const t = useT(dict);
  return (
    <Link href="/merchant/farms" className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
      <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
      {t("back")}
    </Link>
  );
}

export default function FarmEditor({ id, justCreated }: { id: string; justCreated?: boolean }) {
  const t = useT(dict);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["farm", id], queryFn: () => fetchFarm(id) });
  // Documents have their own query. Their signed links expire, so the list is refetched
  // on every visit and never cached as stale.
  const docs = useQuery({ queryKey: ["farm-docs", id], queryFn: () => fetchFarmDocuments(id), staleTime: 0 });

  const refreshFarm = () => qc.invalidateQueries({ queryKey: ["farm", id] });
  const refreshDocs = () => qc.invalidateQueries({ queryKey: ["farm-docs", id] });

  return (
    <div>
      <BackToFarms />
      <QueryState q={q}>
        {(farm) => (
          <div className="space-y-12">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-bold">{farm.displayName || farm.name}</h1>
                <FarmStatusBadge status={farm.status} />
              </div>
              <FarmForm farm={farm} justCreated={justCreated} />
            </div>

            <section className="max-w-2xl">
              <h2 className="mb-4 font-display text-xl font-bold">{t("mediaTitle")}</h2>
              <AssetManager
                assets={farmMedia(farm)}
                accept="image/*,video/*"
                onUpload={async (files) => {
                  await uploadFarmMedia(id, files);
                  await refreshFarm();
                }}
                onRemove={async (mediaId) => {
                  await deleteFarmMedia(id, mediaId);
                  await refreshFarm();
                }}
              />
            </section>

            <section className="max-w-2xl">
              <h2 className="font-display text-xl font-bold">{t("docsTitle")}</h2>
              <p className="mb-4 mt-1 text-sm text-muted">{t("docsHint")}</p>
              <AssetManager
                assets={documentAssets(docs.data)}
                accept="application/pdf,image/*"
                onUpload={async (files) => {
                  await uploadFarmDocuments(id, files);
                  await refreshDocs();
                }}
                onRemove={async (docId) => {
                  await deleteFarmDocument(id, docId);
                  await refreshDocs();
                }}
              />
            </section>
          </div>
        )}
      </QueryState>
    </div>
  );
}
