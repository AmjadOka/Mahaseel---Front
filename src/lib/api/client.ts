import { useAuthStore, type Tokens } from "@/stores/auth-store";
import { API_BASE, ApiError, apiErrorFrom, isObj, readBody } from "./base";

// One ApiError and one API_BASE for the whole app. The browser client and server fetch share lib/api/base.
export { API_BASE, ApiError };

type Query = Record<string, string | number | boolean | null | undefined>;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Opts = {
  auth?: boolean;
  params?: Query;
  signal?: AbortSignal;
  /** Replaces API_BASE for this call. The admin calls use it to reach the same-origin proxy. */
  base?: string;
};
type RefreshResult = "ok" | "invalid" | "transient";

/** Accepts `{accessToken, refreshToken}` bare, or nested under `data` / `tokens`. */
export function pickTokens(res: unknown): Tokens | null {
  const candidates = [
    res,
    isObj(res) ? res.data : undefined,
    isObj(res) ? res.tokens : undefined,
  ];
  for (const c of candidates) {
    if (
      isObj(c) &&
      typeof c.accessToken === "string" &&
      typeof c.refreshToken === "string"
    ) {
      return { accessToken: c.accessToken, refreshToken: c.refreshToken };
    }
  }
  return null;
}

function buildUrl(path: string, params: Query | undefined, base: string) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {}))
    if (v !== undefined && v !== null) qs.set(k, String(v));
  const q = qs.toString();
  return `${base.replace(/\/$/, "")}${path}${q ? `?${q}` : ""}`;
}

async function raw<T>(
  method: Method,
  path: string,
  body: unknown,
  opts: Opts
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData; // the browser sets the multipart boundary itself
  if (body !== undefined && !isForm)
    headers["Content-Type"] = "application/json";
  const token =
    opts.auth === false ? null : useAuthStore.getState().accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.params, opts.base ?? API_BASE), {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isForm
          ? (body as FormData)
          : JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "Network error");
  }

  const data = await readBody(res);
  if (!res.ok) throw apiErrorFrom(res, data);
  return data as T;
}

/** One refresh at a time. Parallel 401s all wait on the same promise. */
let refreshing: Promise<RefreshResult> | null = null;

/**
 * Only a refresh token the server rejects ends the session. A rate limit (429), a server
 * error, or a dropped connection leaves the session alone. Otherwise a throttled refresh
 * would log the user out, and throttling is per IP, so it hits everyone behind one NAT.
 */
async function refresh(): Promise<RefreshResult> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return "invalid";
  try {
    const tokens = pickTokens(
      await raw<unknown>(
        "POST",
        "/auth/refresh",
        { refreshToken },
        { auth: false }
      )
    );
    if (!tokens) {
      clear();
      return "invalid";
    }
    setTokens(tokens);
    return "ok";
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      clear();
      return "invalid";
    }
    return "transient";
  }
}

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  opts: Opts = {}
): Promise<T> {
  try {
    return await raw<T>(method, path, body, opts);
  } catch (e) {
    const canRefresh =
      e instanceof ApiError &&
      e.status === 401 &&
      opts.auth !== false &&
      !!useAuthStore.getState().refreshToken;
    if (!canRefresh) throw e;

    refreshing ??= refresh().finally(() => {
      refreshing = null;
    });
    const result = await refreshing;

    if (result === "ok") return raw<T>(method, path, body, opts); // retry once with the new access token
    if (result === "invalid" && typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard redirect clears all client state
      window.location.href = "/login";
    }
    throw e; // transient: surface the original error, keep the session
  }
}

export const apiGet = <T>(
  path: string,
  params?: Query,
  opts?: Omit<Opts, "params">
) => request<T>("GET", path, undefined, { ...opts, params });
export const apiPost = <T>(path: string, body?: unknown, opts?: Opts) =>
  request<T>("POST", path, body ?? {}, opts);
export const apiPatch = <T>(path: string, body?: unknown, opts?: Opts) =>
  request<T>("PATCH", path, body ?? {}, opts);
export const apiPut = <T>(path: string, body?: unknown, opts?: Opts) =>
  request<T>("PUT", path, body ?? {}, opts);
export const apiDelete = <T>(path: string, opts?: Opts) =>
  request<T>("DELETE", path, undefined, opts);
/** Method chosen at runtime. The admin helpers use it for mutations. */
export const apiMutate = <T>(
  method: Exclude<Method, "GET">,
  path: string,
  body?: unknown,
  opts?: Opts
) =>
  request<T>(method, path, method === "DELETE" ? undefined : body ?? {}, opts);
/** multipart/form-data upload (product media, farm documents, avatar…). */
export const apiForm = <T>(
  method: "POST" | "PUT" | "PATCH",
  path: string,
  form: FormData,
  opts?: Opts
) => request<T>(method, path, form, opts);
