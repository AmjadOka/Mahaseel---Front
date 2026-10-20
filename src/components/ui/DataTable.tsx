import type { ReactNode } from "react";

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; className?: string };

export default function DataTable<T>({ caption, columns, rows, rowKey }: { caption: string; columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[42rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-grove-soft/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`px-4 py-3 text-start font-medium text-muted ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={rowKey(r)} className="align-top">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
