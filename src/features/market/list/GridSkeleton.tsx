export default function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid animate-pulse gap-5 motion-reduce:animate-none sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="aspect-[4/3] bg-line/60" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 rounded bg-line/60" />
            <div className="h-4 w-1/3 rounded bg-line/60" />
            <div className="h-7 w-1/2 rounded bg-line/60" />
          </div>
        </li>
      ))}
    </ul>
  );
}
