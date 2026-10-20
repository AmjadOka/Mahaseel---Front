import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

export default function Alert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const error = tone === "error";
  const Icon = error ? CircleAlert : CircleCheck;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-lg border border-line border-s-4 bg-surface p-4 text-sm ${error ? "border-s-pomegranate" : "border-s-grove"}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${error ? "text-pomegranate" : "text-grove"}`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
