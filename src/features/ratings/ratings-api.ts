import { isObj } from "@/lib/api/base";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizePage } from "@/lib/api/paginate";

type Party = { id?: string; fullName?: string | null } | null;

/** RatingsService joins `reviewer` + `order` on received lists and `reviewed` + `order` on given lists. */
export interface Rating {
  id: string;
  score: number | string;
  comment?: string | null;
  createdAt?: string;
  orderId?: string;
  reviewer?: Party;
  reviewed?: Party;
}

export const RATINGS_PAGE_SIZE = 10;

/** CreateRatingDto: orderId (uuid), score 1–5, comment ≤ 500 (optional). */
export const createRating = (b: { orderId: string; score: number; comment?: string }) => apiPost("/ratings", { ...b, comment: b.comment?.trim() || undefined });

/** UpdateRatingDto: score 1–5 and/or comment ≤ 500. Only the reviewer can edit. */
export const updateRating = (id: string, b: { score: number; comment?: string }) => apiPatch(`/ratings/${id}`, { score: b.score, comment: b.comment?.trim() ?? "" });

/** FlagRatingDto: reason (FlagReason), notes ≤ 300. Only the reviewed party can flag; one flag each (409). */
export const flagRating = (id: string, b: { reason: string; notes?: string }) => apiPost(`/ratings/${id}/flag`, { reason: b.reason, notes: b.notes?.trim() || undefined });

export const fetchRatings = async (kind: "received" | "given", page: number) =>
  normalizePage<Rating>(await apiGet<unknown>(kind === "received" ? "/ratings/me" : "/ratings/given", { page, limit: RATINGS_PAGE_SIZE }), page, RATINGS_PAGE_SIZE);

/** `GET /ratings/user/:id` — documented as public, but the controller's JwtAuthGuard makes it login-only. */
export const fetchUserRatings = async (userId: string, page: number) =>
  normalizePage<Rating>(await apiGet<unknown>(`/ratings/user/${userId}`, { page, limit: RATINGS_PAGE_SIZE }), page, RATINGS_PAGE_SIZE);

export const nameOf = (u: Party | undefined) => (isObj(u) && typeof u.fullName === "string" && u.fullName ? u.fullName : null);
