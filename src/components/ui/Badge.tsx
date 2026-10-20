import type { ReactNode } from "react";

export type Tone = "wait" | "pay" | "go" | "done" | "stop";
const DOT: Record<Tone, string> = {
  wait: "bg-oil",
  pay: "bg-pomegranate",
  go: "bg-grove",
  done: "bg-grove",
  stop: "bg-muted",
};

export default function Badge({
  tone,
  children,
}: {
  tone: Tone;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium">
      <span className={`size-2 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}
