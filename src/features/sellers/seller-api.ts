import "server-only";
import { isObj } from "@/lib/api/base";
import { serverGet } from "@/lib/api/server";
import { num } from "@/features/market/format";

export interface SellerProfile {
  name: string;
  avatar: string | null;
  bio: string | null;
  avg: number | null;
  count: number;
}

/** Public `GET /users/:id/profile` (safe fields only). Null when missing or unreadable. */
export async function getSellerProfile(id: string): Promise<SellerProfile | null> {
  try {
    const body = await serverGet(`/users/${encodeURIComponent(id)}/profile`, { revalidate: 60 });
    const p: Record<string, unknown> = isObj(body) && isObj(body.data) ? body.data : isObj(body) ? body : {};
    if (typeof p.fullName !== "string" || !p.fullName) return null;
    return {
      name: p.fullName,
      avatar: typeof p.profileImage === "string" ? p.profileImage : null,
      bio: typeof p.bio === "string" && p.bio ? p.bio : null,
      avg: num(p.ratingAvg),
      count: num(p.ratingCount) ?? 0,
    };
  } catch {
    return null;
  }
}
