import GridSkeleton from "@/features/market/list/GridSkeleton";

export default function MarketLoading() {
  return (
    <div className="wrap animate-pulse py-10 motion-reduce:animate-none lg:py-14">
      <div className="h-10 w-40 rounded bg-line/60" />
      <div className="mt-3 h-4 w-64 rounded bg-line/60" />
      <div className="mt-6 h-12 rounded-full bg-line/60" />
      <div className="mt-8">
        <GridSkeleton />
      </div>
    </div>
  );
}
