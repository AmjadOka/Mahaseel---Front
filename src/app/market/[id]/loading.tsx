export default function ProductLoading() {
  const bone = "rounded bg-line/60";
  return (
    <div className="wrap grid animate-pulse gap-10 py-10 motion-reduce:animate-none lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className={`aspect-[4/3] rounded-3xl ${bone}`} />
      <div className="space-y-4">
        <div className={`h-6 w-24 ${bone}`} />
        <div className={`h-10 w-2/3 ${bone}`} />
        <div className={`h-44 rounded-2xl ${bone}`} />
        <div className={`h-28 rounded-2xl ${bone}`} />
      </div>
    </div>
  );
}
