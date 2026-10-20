export default function BarChart({
  data,
  label,
  format,
}: {
  data: { label: string; value: number }[];
  label: string;
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <div
        role="img"
        aria-label={label}
        className="flex h-44 items-end gap-1 [direction:ltr]"
      >
        {data.map((d, i) => (
          <div
            key={`bar-${i}`}
            className="group relative flex h-full min-w-0 flex-1 items-end"
            title={`${d.label}: ${format(d.value)}`}
          >
            <div
              className="w-full rounded-t bg-grove transition-opacity group-hover:opacity-80"
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div
        className="mt-2 flex gap-1 text-[10px] text-muted [direction:ltr]"
        aria-hidden="true"
      >
        {data.map((d, i) => (
          <span
            key={`lbl-${i}`}
            className="figure min-w-0 flex-1 truncate text-center"
          >
            {data.length > 16 && i % 3 !== 0 ? "" : d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={`row-${i}`}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
