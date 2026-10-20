import SiteShell from "@/components/site/SiteShell";

export default function MarketLayout({ children }: LayoutProps<"/market">) {
  return <SiteShell>{children}</SiteShell>;
}
