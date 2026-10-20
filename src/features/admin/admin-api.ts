"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, isObj } from "@/lib/api/base";
import { apiGet, apiMutate } from "@/lib/api/client";
import { normalizePage } from "@/lib/api/paginate";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./admin.i18n";

export const ADMIN_PAGE_SIZE = 20;

/**
 * Same-origin proxy (app/api/admin). Admin paths here are relative to /admin on
 * the backend: adminGet("/farms") reaches /admin/farms.
 */
const ADMIN_BASE = "/api/admin";

type Params = Record<string, string | undefined>;
type Method = "POST" | "PUT" | "PATCH" | "DELETE";
type FormMethod = "POST" | "PUT" | "PATCH";

/** Drops empty and undefined params, so they're never sent. */
const clean = (params: Params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ) as Record<string, string>;

/**
 * ADMIN_BASE already ends in /admin, so a leading "admin" segment would double it
 * (/api/admin/admin/dashboard). Accepts "/farms", "farms" or "/admin/farms".
 */
const normalizePath = (path: string) => {
  const p = path.replace(/^\/+/, "").replace(/^admin(?=\/|$)/, "");
  return "/" + p.replace(/^\/+/, "");
};

/** GET an admin route. Token refresh on 401 comes from the shared client. */
export const adminGet = <T = unknown>(path: string, params?: Params) =>
  apiGet<T>(normalizePath(path), clean(params ?? {}), { base: ADMIN_BASE });

/** POST, PUT, PATCH or DELETE an admin route with a JSON body. */
export const adminMutate = <T = unknown>(
  method: Method,
  path: string,
  body?: unknown
) => apiMutate<T>(method, normalizePath(path), body, { base: ADMIN_BASE });

/**
 * Multipart upload (images, files). Pass a FormData. Do not set Content-Type
 * yourself: the browser adds it with the multipart boundary.
 */
export const adminForm = <T = unknown>(
  method: FormMethod,
  path: string,
  form: FormData
) => apiMutate<T>(method, normalizePath(path), form, { base: ADMIN_BASE });

/**
 * The API wraps responses in `{ data }`. Unwrap arrays and objects alike.
 * Entities carry `id`, so they are never unwrapped by mistake.
 */
export function unwrapData<T>(r: unknown): T {
  return (isObj(r) && "data" in r && !("id" in r) ? r.data : r) as T;
}

/** Paginated list. normalizePage reads the response itself, since it handles the paging envelope. */
export function useAdminList<T>(
  key: string,
  path: string,
  page: number,
  params: Params = {},
  enabled = true
) {
  return useQuery({
    queryKey: ["admin", key, path, page, params],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      normalizePage<T>(
        await adminGet<unknown>(path, {
          ...params,
          page: String(page),
          limit: String(ADMIN_PAGE_SIZE),
        }),
        page,
        ADMIN_PAGE_SIZE
      ),
  });
}

/** Non-paginated read: arrays, stats, single records. */
export function useAdminQuery<T>(
  key: string,
  path: string,
  params: Params = {},
  enabled = true
) {
  return useQuery({
    queryKey: ["admin", key, path, params],
    enabled,
    queryFn: async () => unwrapData<T>(await adminGet<unknown>(path, params)),
  });
}

/** Runs one admin mutation, refreshes every admin query, and returns a readable error. */
export function useAdminAction() {
  const qc = useQueryClient();
  const apiError = useApiError();
  const t = useT(dict);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      return true;
    } catch (e) {
      const base = apiError(e, { 400: t("rejected"), 409: t("conflict") });
      setError(
        e instanceof ApiError &&
          (e.status === 400 || e.status === 409) &&
          e.message
          ? `${base} (${e.message})`
          : base
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error, clearError: () => setError(null) };
}

/**
 * Bare YYYY-MM-DD. The backend's dayRange treats `from` as 00:00 UTC and `to` as
 * the end of that whole day, so no time suffix is needed.
 */
export const dayStart = (d: string) => (d ? d : undefined);
export const dayEnd = (d: string) => (d ? d : undefined);
