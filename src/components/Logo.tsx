export default function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="var(--grove)" />
        <path d="M16 25V14" stroke="var(--on-solid)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 15c0-4 2.6-6.4 7-6.6.1 4.4-2.5 6.8-7 6.6Z" fill="var(--on-solid)" />
        <path d="M16 18.5c0-3.2-2.2-5-5.8-5.2-.1 3.6 2.1 5.4 5.8 5.2Z" fill="var(--on-solid)" opacity=".7" />
      </svg>
      <span className="font-display text-2xl leading-none font-bold">{name}</span>
    </span>
  );
}
