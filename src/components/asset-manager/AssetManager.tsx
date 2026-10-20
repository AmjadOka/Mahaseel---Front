"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Play, Trash2, UploadCloud } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import { useApiError } from "@/lib/api/useApiError";
import { cld } from "@/lib/cloudinary";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./asset-manager.i18n";

export type Asset = { id: string; url: string; kind: "image" | "video" | "document"; name?: string };

type Props = {
  assets: Asset[];
  accept: string;
  max?: number;
  onUpload: (files: File[]) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
};

export default function AssetManager({ assets, accept, max = 10, onUpload, onRemove }: Props) {
  const t = useT(dict);
  const apiError = useApiError();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Asset | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  async function upload(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    if (assets.length + files.length > max) return setError(t("max", { n: max }));
    setError(null);
    setBusy(true);
    try {
      await onUpload(files);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await onRemove(removing.id);
      setRemoving(null);
    } catch (e) {
      setRemoving(null);
      setError(apiError(e));
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted transition-colors hover:border-grove"
      >
        {busy ? <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <UploadCloud className="size-6" aria-hidden="true" />}
        {busy ? t("uploading") : t("drop")}
        <input ref={input} type="file" multiple accept={accept} disabled={busy} onChange={(e) => void upload(e.target.files)} className="sr-only" />
      </label>

      {assets.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((a) => (
            <li key={a.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-grove-soft">
              <a href={a.url} target="_blank" rel="noreferrer" aria-label={`${t("open")}${a.name ? `: ${a.name}` : ""}`} className="grid size-full place-items-center">
                {a.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
                  <img src={cld(a.url, 300)} alt="" loading="lazy" className="size-full object-cover" />
                ) : a.kind === "video" ? (
                  <Play className="size-8 text-grove" aria-hidden="true" />
                ) : (
                  <span className="flex flex-col items-center gap-2 p-2 text-center text-xs">
                    <FileText className="size-8 text-grove" aria-hidden="true" />
                    <span className="line-clamp-2 break-all">{a.name}</span>
                  </span>
                )}
              </a>
              <button type="button" onClick={() => setRemoving(a)} aria-label={t("remove")} className="absolute end-2 top-2 grid size-8 place-items-center rounded-full bg-paper/90 text-pomegranate shadow transition-colors hover:bg-paper">
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={!!removing} title={t("removeTitle")} body={t("removeBody")} confirmLabel={t("yes")} cancelLabel={t("keep")} danger busy={removeBusy} onConfirm={() => void remove()} onClose={() => !removeBusy && setRemoving(null)} />
    </div>
  );
}
