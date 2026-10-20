import { NextRequest, NextResponse } from "next/server";

// Server-only environment. Never prefix these with NEXT_PUBLIC_, which would ship them to the browser.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Ctx = { params: Promise<{ path: string[] }> | { path: string[] } };

/**
 * Forwards /api/admin/<path> to <API_BASE>/admin/<path>. The browser's bearer token
 * goes through unchanged, so the backend still checks the user's role. The admin
 * secret is added here, on the server, and never returned.
 */
async function forward(req: NextRequest, ctx: Ctx) {
  const adminSecret = (process.env.ADMIN_SECRET ?? "").trim();
  if (!adminSecret) {
    console.error(
      "[admin proxy] ADMIN_SECRET is empty. Set it in .env.local and restart next dev."
    );
    return NextResponse.json(
      { message: "Admin proxy is not configured" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { path } = await Promise.resolve(ctx.params);
  const target = new URL(
    `${API_BASE}/admin/${path.map(encodeURIComponent).join("/")}`
  );
  req.nextUrl.searchParams.forEach((value, key) =>
    target.searchParams.set(key, value)
  );

  const contentType = req.headers.get("content-type");
  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: auth,
      "X-Admin-Secret": adminSecret,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    cache: "no-store",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    console.error(`[admin proxy] ${req.method} ${target} failed:`, err);
    return NextResponse.json(
      { message: "Backend unreachable" },
      { status: 502 }
    );
  }

  const body = upstream.status === 204 ? null : await upstream.text();

  if ([401, 403, 404].includes(upstream.status)) {
    console.error(
      `[admin proxy] ${upstream.status} from ${
        req.method
      } ${target.toString()} -> ${body}`
    );
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
