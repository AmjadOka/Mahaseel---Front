"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Returns `update(patch)`: merges the patch into the current URL params
 * (undefined removes a key), resets pagination, and replaces the URL.
 */
export function useMarketNav() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
}
