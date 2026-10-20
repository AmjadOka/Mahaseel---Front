"use client";

import Link from "next/link";
import { useNavItems } from "./useNavItems";

export default function HeaderNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const items = useNavItems(links);
  return (
    <nav className="ms-8 hidden items-center gap-7 text-sm md:flex">
      {items.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-muted transition-colors hover:text-ink"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
