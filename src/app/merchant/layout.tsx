import SiteShell from "@/components/site/SiteShell";
import MerchantShell from "@/features/merchant/MerchantShell";

export default function MerchantLayout({ children }: LayoutProps<"/merchant">) {
  return (
    <SiteShell>
      <MerchantShell>{children}</MerchantShell>
    </SiteShell>
  );
}
