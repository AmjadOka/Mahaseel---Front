"use client";

import Link from "next/link";
import { useSignedIn } from "@/features/auth/useSignedIn";

type Item = { href: string; label: string };

export default function FooterNav({
  links,
  authLinks,
}: {
  links: Item[];
  authLinks: Item[];
}) {
  const signedIn = useSignedIn();
  // Signed-in users only get the marketplace link: no landing anchors, no login/signup.
  const items = signedIn
    ? links.filter((l) => l.href === "/market")
    : [...links, ...authLinks];
  return (
    <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
      {items.map((l) => (
        <Link key={l.href} href={l.href} className="text-muted hover:text-ink">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
