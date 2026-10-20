import { isObj } from "@/lib/api/base";
import { apiDelete, apiForm, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { asList } from "@/lib/api/paginate";
import type { Farm } from "./types";

const unwrap = <T,>(r: unknown): T => (isObj(r) && isObj(r.data) && !("id" in r) ? r.data : r) as T;

/**
 * GET /farms returns { items, meta }. asList reads items, data, or a bare array, and one
 * level of double wrapping, so it works whether or not the response interceptor wraps it.
 * The farm picker needs the whole list, so ask for the server's maximum page (50). A
 * merchant with more than 50 farms needs a paged picker.
 */
export const fetchFarms = async (): Promise<Farm[]> =>
  asList<Farm>(await apiGet<unknown>("/farms", { limit: 50 }));

export const fetchFarm = async (id: string) => unwrap<Farm>(await apiGet<unknown>(`/farms/${id}`));

/** CreateFarmDto: name, displayName, managerName (2–150/100), contactPhone (Palestinian mobile), optional locationText/agRegistryNo. */
export type FarmInput = {
  name: string;
  displayName: string;
  managerName: string;
  contactPhone: string;
  locationText?: string;
  agRegistryNo?: string;
  latitude?: number;
  longitude?: number;
};

/** The server accepts latitude and longitude together, or neither. Catch the mismatch before the request. */
const assertCoords = (b: Partial<FarmInput>) => {
  if ((b.latitude == null) !== (b.longitude == null)) {
    throw new Error("Send latitude and longitude together, or leave both out.");
  }
};

export const createFarm = async (b: FarmInput) => {
  assertCoords(b);
  return unwrap<Farm>(await apiPost<unknown>("/farms", b));
};
export const updateFarm = async (id: string, b: Partial<FarmInput>) => {
  assertCoords(b);
  return unwrap<Farm>(await apiPut<unknown>(`/farms/${id}`, b));
};

/** Soft delete. Refused while the farm is approved, or while an open order holds one of its products. */
export const deleteFarm = (id: string) => apiDelete(`/farms/${id}`);

/** Photos and documents, one form field. Documents accept images or PDF. */
const form = (files: File[]) => {
  const f = new FormData();
  files.forEach((file) => f.append("files", file));
  return f;
};
export const uploadFarmMedia = (id: string, files: File[]) => apiForm("PATCH", `/farms/${id}/media`, form(files));
export const uploadFarmDocuments = (id: string, files: File[]) => apiForm("PATCH", `/farms/${id}/documents`, form(files));
export const deleteFarmMedia = (id: string, mediaId: string) => apiDelete(`/farms/${id}/media/${mediaId}`);
export const deleteFarmDocument = (id: string, docId: string) => apiDelete(`/farms/${id}/documents/${docId}`);

export interface FarmDocument {
  id: string;
  createdAt?: string;
  /** Signed link. Null only for a document with no stored file. */
  url: string | null;
  expiresAt: string | null;
}

/**
 * The owner's documents. Each link expires after 5 minutes, so fetch the list when the
 * owner opens it, not when the farm page loads.
 */
export const fetchFarmDocuments = async (id: string) =>
  asList<FarmDocument>(await apiGet<unknown>(`/farms/${id}/documents`));
