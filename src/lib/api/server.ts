import "server-only";
import { API_BASE, ApiError, apiErrorFrom, readBody } from "./base";

/**
 * Public GET for server components. No auth, no token refresh.
 * `revalidate` (seconds) caches the response; omit it for always-fresh data.
 */
export async function serverGet(path: string, opts: { revalidate?: number } = {}): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      ...(opts.revalidate ? { next: { revalidate: opts.revalidate } } : { cache: "no-store" as const }),
    });
  } catch {
    throw new ApiError(0, "Network error");
  }
  const data = await readBody(res);
  if (!res.ok) throw apiErrorFrom(res, data);
  return data;
}
