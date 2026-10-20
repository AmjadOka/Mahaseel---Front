import Link from "next/link";
import type { ReactNode } from "react";

export default function StatCard({ label, value, hint, href, tone = "ink" }: { label: string; value: ReactNode; hint?: string; href?: string; tone?: "ink" | "grove" | "pomegranate" | "oil" }) {
  const color = { ink: "text-ink", grove: "text-grove", pomegranate: "text-pomegranate", oil: "text-oil" }[tone];
  const body = (
    <>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`figure mt-2 font-display text-3xl font-bold ${color}`}>{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted">{hint}</dd>}
    </>
  );
  const cls = "block rounded-2xl border border-line bg-surface p-5";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-grove`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
