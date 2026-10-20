"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Field from "@/components/field/Field";
import { adminGet, unwrapData } from "../admin-api";

export type PickedUser = {
  id: string;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
};

export const MAX_PICKED = 500;

const nameOf = (u: PickedUser) => u.fullName || u.phone || u.email || u.id;

type Labels = {
  search: string;
  empty: string;
  selected: string; // already formatted, e.g. "3 selected"
  selectAll: string;
  clear: string;
};

export default function UserPicker({
  value,
  onChange,
  labels,
}: {
  value: PickedUser[];
  onChange: (next: PickedUser[]) => void;
  labels: Labels;
}) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");

  // Wait 300 ms after typing stops, so each keystroke doesn't hit the API.
  useEffect(() => {
    const id = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text]);

  const { data: users = [], isFetching } = useQuery({
    queryKey: ["admin", "broadcast-users", q],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = unwrapData<unknown>(
        await adminGet("/users", { search: q, page: "1", limit: "50" })
      );
      const list = Array.isArray(res)
        ? res
        : (res as { items?: unknown[] } | null)?.items ?? [];
      return list as PickedUser[];
    },
  });

  const picked = new Set(value.map((u) => u.id));
  const full = value.length >= MAX_PICKED;

  const toggle = (u: PickedUser) => {
    if (picked.has(u.id)) onChange(value.filter((x) => x.id !== u.id));
    else if (!full) onChange([...value, u]);
  };

  const addAll = () => {
    const fresh = users.filter((u) => !picked.has(u.id));
    onChange([...value, ...fresh].slice(0, MAX_PICKED));
  };

  return (
    <div className="space-y-3">
      <Field
        label={labels.search}
        ltr
        value={text}
        onChange={(e: { target: { value: string } }) => setText(e.target.value)}
      />

      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {labels.selected} ({value.length}/{MAX_PICKED})
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={addAll}
            disabled={full || users.length === 0}
            className="text-grove disabled:opacity-40"
          >
            {labels.selectAll}
          </button>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-muted"
            >
              {labels.clear}
            </button>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
          {value.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u)}
              className="rounded-full border border-grove bg-grove-soft px-3 py-1 text-xs text-grove"
            >
              {nameOf(u)} ✕
            </button>
          ))}
        </div>
      )}

      <ul
        className={`max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line ${
          isFetching ? "opacity-60" : ""
        }`}
      >
        {users.length === 0 && (
          <li className="p-4 text-center text-sm text-muted">{labels.empty}</li>
        )}
        {users.map((u) => {
          const on = picked.has(u.id);
          return (
            <li key={u.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-grove-soft">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!on && full}
                  onChange={() => toggle(u)}
                />
                <span className="flex-1 truncate">{nameOf(u)}</span>
                <span className="figure text-xs text-muted" dir="ltr">
                  {u.phone ?? u.email ?? ""}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
