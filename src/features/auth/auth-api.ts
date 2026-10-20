import { ApiError, API_BASE, apiGet, apiPost, pickTokens } from "@/lib/api/client";
import { AUTH_STORAGE_KEY, normalizeUser, useAuthStore, type AuthUser, type Role, type Tokens } from "@/stores/auth-store";

// Request bodies follow the backend's controller. Verified against auth.controller.ts.
const pub = { auth: false } as const;

/**
 * Starts Google sign-in. The backend redirects back to /auth/success with a one-time
 * code, never a token. See the round 2 backend changes.
 */
export const GOOGLE_URL = `${API_BASE}/auth/google`;

export async function signIn(email: string, password: string): Promise<Tokens> {
  const tokens = pickTokens(await apiPost("/auth/signin", { email, password }, pub));
  if (!tokens) throw new ApiError(500, "Malformed sign-in response");
  return tokens;
}

/**
 * Trades the one-time code from the Google callback for tokens. Needs the backend route
 * POST /auth/google/exchange, which is part of the round 2 backend changes.
 */
export async function exchangeGoogleCode(code: string): Promise<Tokens> {
  const tokens = pickTokens(await apiPost("/auth/google/exchange", { code }, pub));
  if (!tokens) throw new ApiError(500, "Malformed Google exchange response");
  return tokens;
}

export const signUp = (b: { fullName: string; email: string; password: string }) => apiPost("/auth/signup", b, pub);
export const verifyEmail = (email: string, code: string) => apiPost("/auth/verify-email", { email, code }, pub);
export const resendVerification = (email: string) => apiPost("/auth/resend-verification", { email }, pub);
export const sendResetCode = (email: string) => apiPost("/auth/reset/send-code", { email }, pub);
export const verifyResetCode = (email: string, code: string) => apiPost("/auth/reset/verify", { email, code }, pub);

/**
 * ChangePasswordDto is { email, newPassword }. verifyResetCode already checked the code,
 * and that step lets this one through for 15 minutes. Sending the code again is a 400,
 * because the server rejects unknown fields.
 */
export const changePassword = (email: string, newPassword: string) =>
  apiPost("/auth/reset/change-password", { email, newPassword }, pub);

/**
 * Sets a password on an account that has none, such as a Google-only account. Needs a
 * signed-in session, so the access token is sent.
 */
export const setPassword = (newPassword: string) => apiPost("/auth/set-password", { newPassword });

/** Ends the session on this device. */
export const logout = () => apiPost("/auth/logout");

/** Ends every session on every device. */
export const logoutAll = () => apiPost("/auth/logout-all");

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiGet<{ data?: AuthUser } & AuthUser>("/users/me");
  return normalizeUser(res.data ?? res);
}

/** Only same-site paths. Blocks `?next=https://evil.com` and `//evil.com`. */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export const homeFor = (role?: Role) => (role === "ADMIN" ? "/admin" : role === "MERCHANT" ? "/merchant/orders" : "/market");

/**
 * Hard navigation after login. Confirms the persisted auth state has reached
 * localStorage before leaving, so the next page doesn't boot logged out.
 */
export async function navigateAfterAuth(path: string) {
  const token = useAuthStore.getState().accessToken;
  for (let i = 0; i < 10; i++) {
    if (token && localStorage.getItem(AUTH_STORAGE_KEY)?.includes(token)) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  window.location.href = path;
}

/** Best-effort server logout (blacklists the access token), then clears local state and reloads. */
export async function signOut() {
  try {
    await logout();
  } catch {
    // The local session is what matters.
  }
  useAuthStore.getState().clear();
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a hard reload drops every cached query and in-memory token
  window.location.href = "/";
}
