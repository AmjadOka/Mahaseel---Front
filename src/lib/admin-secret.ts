const KEY = "mahaseel-admin-secret";
const listeners = new Set<() => void>();

export const getAdminSecret = (): string | null => {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};
export const setAdminSecret = (v: string) => {
  try {
    sessionStorage.setItem(KEY, v);
  } catch {}
  listeners.forEach((l) => l());
};
export const clearAdminSecret = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
};
export const subscribeAdminSecret = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
