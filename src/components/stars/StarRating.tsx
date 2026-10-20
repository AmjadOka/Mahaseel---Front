"use client";

import { Star } from "lucide-react";

/** Read-only when `onChange` is omitted. Labels are just "n / 5" so they need no translation. */
export default function StarRating({ value, onChange, size = "size-5" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  const stars = [1, 2, 3, 4, 5];
  if (!onChange) {
    return (
      <span role="img" aria-label={`${value} / 5`} className="inline-flex gap-0.5">
        {stars.map((n) => (
          <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-oil text-oil" : "text-line"}`} aria-hidden="true" />
        ))}
      </span>
    );
  }
  return (
    <div role="radiogroup" className="inline-flex gap-1 [direction:ltr]">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} / 5`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110 motion-reduce:transition-none"
        >
          <Star className={`${size} ${n <= value ? "fill-oil text-oil" : "text-muted"}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
