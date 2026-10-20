import Link from "next/link";
import Logo from "@/components/Logo";
import LocaleToggle from "@/components/locale-toggle/LocaleToggle";
import ThemeToggle from "@/components/theme-toggle/ThemeToggle";
import { getT } from "@/lib/i18n/server";
import dict from "@/features/auth/shell/auth-shell.i18n";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getT(dict);
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col">
        <header className="wrap flex h-16 items-center justify-between">
          <Link href="/" aria-label={t("brand")}>
            <Logo name={t("brand")} />
          </Link>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="wrap grid flex-1 place-items-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>

      <aside className="furrows relative hidden bg-grove text-on-solid lg:flex lg:flex-col lg:justify-end lg:p-14" aria-hidden="true">
        <p className="max-w-sm font-display text-4xl leading-snug font-bold">{t("headline")}</p>
        <ul className="mt-8 space-y-3 opacity-90">
          {(["p1", "p2", "p3"] as const).map((k) => (
            <li key={k} className="border-s-2 border-on-solid/40 ps-4">
              {t(k)}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
