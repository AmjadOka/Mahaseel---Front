const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export default function Money({ value, className = "" }: { value: number | null; className?: string }) {
  return <span className={`figure ${className}`}>{value === null ? "—" : `${nf.format(value)} ₪`}</span>;
}
