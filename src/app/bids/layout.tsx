import SiteShell from "@/components/site/SiteShell";

export default function BidsLayout({ children }: LayoutProps<"/bids">) {
  return <SiteShell>{children}</SiteShell>;
}
