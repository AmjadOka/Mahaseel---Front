import { isObj } from "@/lib/api/base";
import { apiDelete, apiForm, apiGet, apiPatch } from "@/lib/api/client";
import { normalizeUser, useAuthStore, type AuthUser } from "@/stores/auth-store";

export interface Account extends AuthUser {
  bio?: string | null;
  profileImage?: string | null;
  promotionStatus?: string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number | string | null;
}

const unwrap = (r: unknown): Account => normalizeUser((isObj(r) && isObj(r.data) && !("id" in r) ? r.data : r) as Account);

/** Every call that returns the user also refreshes the copy the header reads. */
const sync = (a: Account) => {
  if (a?.id) useAuthStore.getState().setUser(a);
  return a;
};

export const fetchAccount = async () => sync(unwrap(await apiGet<unknown>("/users/me")));
export const updateProfile = async (b: { fullName: string; bio?: string }) => sync(unwrap(await apiPatch<unknown>("/users/me", b)));

/** Avatar changes now refresh the header as well. The old version skipped the sync, so the header kept the old picture. */
export const uploadAvatar = async (file: File) => {
  const f = new FormData();
  f.append("file", file);
  return sync(unwrap(await apiForm<unknown>("PATCH", "/users/me/avatar", f)));
};
/** The delete response isn't known to carry the user, so re-read it: that way the header is always right. */
export const removeAvatar = async () => {
  await apiDelete("/users/me/avatar");
  return fetchAccount();
};
export const requestMerchant = () => apiPatch("/users/me/promote-to-merchant");
