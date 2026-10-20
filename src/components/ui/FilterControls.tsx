"use client";

import { useState, type ReactNode } from "react";

const field = "input h-10 min-w-0 py-0 text-sm";

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end gap-3">{children}</div>;
}

export function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${field} mt-1 block`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextFilter({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: "text" | "date" }) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${field} mt-1 block ${type === "date" ? "figure" : ""}`} />
    </label>
  );
}


/** Applies on Enter / button press, so typing doesn't refetch on every keystroke. */
export function SearchFilter({ label, buttonLabel, onSearch, placeholder }: { label: string; buttonLabel: string; onSearch: (v: string) => void; placeholder?: string }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(v.trim());
      }}
      className="flex items-end gap-2"
    >
      <label className="block text-xs text-muted">
        {label}
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className={`${field} mt-1 block`} />
      </label>
      <button type="submit" className="btn btn-line h-10 px-4">
        {buttonLabel}
      </button>
    </form>
  );
}
