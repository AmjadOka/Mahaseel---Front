export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, "");

/** status 0 = the request never reached the server. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Nest errors carry `message: string | string[]`. */
export function apiErrorFrom(res: Response, data: unknown): ApiError {
  const m = isObj(data) ? data.message : null;
  return new ApiError(res.status, Array.isArray(m) ? m.join(", ") : typeof m === "string" ? m : res.statusText, data);
}
