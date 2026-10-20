// Save as features/farms/types.ts. Replaces the uploaded farm types file.
import type { Asset } from "@/components/asset-manager/AssetManager";
import { isObj } from "@/lib/api/base";

interface FarmFile {
  id: string;
  url: string;
  name?: string | null;
  mediaType?: string | null;
  kind?: string | null;
}

/**
 * Fields from CreateFarmDto plus what the farm endpoints add. `media` holds photos and
 * videos. Private documents never come from here: they come from GET /farms/:id/documents,
 * with signed links that expire after 5 minutes.
 */
export interface Farm {
  id: string;
  name: string;
  displayName?: string | null;
  managerName?: string | null;
  contactPhone?: string | null;
  locationText?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  agRegistryNo?: string | null;
  status?: string;
  rejectionReason?: string | null;
  media?: FarmFile[];
  documents?: FarmFile[];
  assets?: FarmFile[];
}

type AssetKind = Asset["kind"];

const isDocument = (f: FarmFile) => String(f.kind ?? "").toLowerCase() === "document";

/** Photos and videos only. A document row in the response is never shown as media. */
export function farmMedia(farm?: Farm): Asset[] {
  if (!farm) return [];
  return (farm.media ?? [])
    .filter((m) => isObj(m) && !!m.url && !isDocument(m))
    .map((m): Asset => ({
      id: m.id,
      url: m.url,
      name: m.name ?? undefined,
      kind: (String(m.mediaType ?? "").toLowerCase() === "video" ? "video" : "image") as AssetKind,
    }));
}

/** Documents from GET /farms/:id/documents. Links that have no URL are left out. */
export function documentAssets(docs: { id: string; url: string | null }[] = []): Asset[] {
  return docs
    .filter((d) => !!d.url)
    .map((d): Asset => ({ id: d.id, url: d.url as string, kind: "document" as AssetKind }));
}

/**
 * Kept so existing imports still compile. "media" returns photos and videos. "document"
 * returns nothing: fetch documents with fetchFarmDocuments and pass them to documentAssets.
 */
export function farmAssets(farm: Farm | undefined, kind: "media" | "document"): Asset[] {
  return kind === "media" ? farmMedia(farm) : [];
}
