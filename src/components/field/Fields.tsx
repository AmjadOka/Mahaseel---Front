"use client";

import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

function Shell({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-2 text-sm text-pomegranate">
          {error}
        </p>
      ) : (
        hint && <p className="mt-2 text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}

type Common = { label: string; error?: string; hint?: string };

export function SelectField({ label, error, hint, className = "", children, ...rest }: Common & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <select id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={`input ${className}`} {...rest}>
        {children}
      </select>
    </Shell>
  );
}

export function TextAreaField({ label, error, hint, className = "", ...rest }: Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={`input h-auto min-h-24 py-3 ${className}`} {...rest} />
    </Shell>
  );
}
