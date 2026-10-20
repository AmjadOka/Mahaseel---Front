import { io, type Socket } from "socket.io-client";
import { API_BASE } from "@/lib/api/base";

/** Socket.IO namespaces live at the API's origin (e.g. `/auctions`), outside the `/api/v1` prefix. */
export function connectNamespace(
  namespace: string,
  getToken?: () => string | null
): Socket {
  return io(`${new URL(API_BASE).origin}${namespace}`, {
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 10_000,
    // Function form re-reads the token on every reconnect.
    auth: getToken ? (cb) => cb({ token: getToken() }) : undefined,
  });
}
