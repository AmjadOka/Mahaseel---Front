import SiteShell from "@/components/site/SiteShell";

export default function OrdersLayout({ children }: LayoutProps<"/orders">) {
  return <SiteShell>{children}</SiteShell>;
}
