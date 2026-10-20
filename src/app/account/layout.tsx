import SiteShell from "@/components/site/SiteShell";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return <SiteShell>{children}</SiteShell>;
}
