import Link from "next/link";
import Logo from "@/components/Logo";
import { getT } from "@/lib/i18n/server";
import FooterNav from "./FooterNav";
import dict from "./footer.i18n";

export default async function Footer() {
  const t = await getT(dict);
  const links = [
    { href: "/market", label: t("market") },
    { href: "/#models", label: t("models") },
    { href: "/#flow", label: t("flow") },
    { href: "/#merchants", label: t("merchants") },
  ];
  const authLinks = [
    { href: "/login", label: t("login") },
    { href: "/signup", label: t("signup") },
  ];
  return (
    <footer className="border-t border-line">
      <div className="wrap flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo name={t("brand")} />
          <p className="mt-3 text-sm text-muted">{t("tagline")}</p>
        </div>
        <FooterNav links={links} authLinks={authLinks} />
      </div>
      <p className="wrap pb-8 text-xs text-muted">
        {t("rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
