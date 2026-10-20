import type { ReactNode } from "react";
import { Sprout, type LucideIcon } from "lucide-react";

export default function EmptyState({ icon: Icon = Sprout, title, hint, action }: { icon?: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <Icon className="size-10 text-grove/40" aria-hidden="true" />
      <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
      {hint && <p className="mt-1 max-w-sm text-muted">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
