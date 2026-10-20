"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useAuthStore } from "@/stores/auth-store";
import dict from "./auth-actions.i18n";
import { useNavItems } from "./useNavItems";

type Item = { href: string; label: string };

export default function MobileMenu({
  links,
  openLabel,
  closeLabel,
}: {
  links: Item[];
  openLabel: string;
  closeLabel: string;
}) {
  const t = useT(dict);
  const [open, setOpen] = useState(false);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const items = useNavItems(links);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center rounded-full border border-line bg-surface"
      >
        {open ? (
          <X className="size-4" aria-hidden="true" />
        ) : (
          <Menu className="size-4" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-line bg-paper p-5 shadow-lg"
        >
          <nav className="flex flex-col gap-1">
            {items.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-lg px-3 py-3 hover:bg-grove-soft"
              >
                {l.label}
              </Link>
            ))}
            {hydrated && !token && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link href="/login" onClick={close} className="btn btn-line">
                  {t("login")}
                </Link>
                <Link href="/signup" onClick={close} className="btn btn-solid">
                  {t("signup")}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
