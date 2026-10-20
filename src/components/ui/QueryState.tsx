"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import Alert from "@/components/Alert";
import { ApiError } from "@/lib/api/base";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./query-state.i18n";

export function ListSkeleton({
  rows = 3,
  height = "h-28",
}: {
  rows?: number;
  height?: string;
}) {
  return (
    <ul
      className="animate-pulse space-y-3 motion-reduce:animate-none"
      aria-hidden="true"
    >
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className={`${height} rounded-2xl border border-line bg-surface`}
        />
      ))}
    </ul>
  );
}

/** Loading → error (with retry) → empty → content, the same everywhere. */
export default function QueryState<T>({
  q,
  isEmpty,
  empty,
  skeleton,
  children,
}: {
  q: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  const t = useT(dict);
  if (q.isPending) {
    // A disabled query stays pending and never fetches. Showing a skeleton for it would never end, so
    // render nothing. The page that disabled the query shows its own placeholder.
    if (q.fetchStatus === "idle") return null;
    return <>{skeleton ?? <ListSkeleton />}</>;
  }
  if (q.isError) {
    return (
      <div className="max-w-lg space-y-3">
        <Alert tone="error">
          {q.error instanceof ApiError && q.error.status === 403
            ? t("forbidden")
            : t("loadError")}
        </Alert>
        <button
          type="button"
          onClick={() => q.refetch()}
          className="btn btn-line"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  if (isEmpty?.(q.data)) return <>{empty}</>;
  return <>{children(q.data)}</>;
}
