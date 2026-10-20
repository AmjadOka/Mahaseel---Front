import Link from "next/link";
import Logo from "@/components/Logo";
import LocaleToggle from "@/components/locale-toggle/LocaleToggle";
import ThemeToggle from "@/components/theme-toggle/ThemeToggle";
import { getT } from "@/lib/i18n/server";
import AuthActions from "./AuthActions";
import HeaderNav from "./HeaderNav";
import MobileMenu from "./MobileMenu";
import dict from "./header.i18n";

export default async function Header() {
  const t = await getT(dict);
  const links = [
    { href: "/market", label: t("navMarket") },
    { href: "/#models", label: t("navModels") },
    { href: "/#flow", label: t("navFlow") },
    { href: "/#merchants", label: t("navMerchants") },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-grove focus:px-4 focus:py-2 focus:text-on-solid"
      >
        {t("skip")}
      </a>
      <div className="wrap flex h-16 items-center gap-3">
        <Link href="/" aria-label={t("brand")}>
          <Logo name={t("brand")} />
        </Link>
        <HeaderNav links={links} />
        <div className="ms-auto flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <AuthActions />
          <MobileMenu
            links={links}
            openLabel={t("menu")}
            closeLabel={t("closeMenu")}
          />
        </div>
      </div>
    </header>
  );
}
