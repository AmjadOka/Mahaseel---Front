import SiteShell from "@/components/site/SiteShell";

export default function PaymentsLayout({ children }: LayoutProps<"/payments">) {
  return <SiteShell>{children}</SiteShell>;
}
