import SiteShell from "@/components/site/SiteShell";
import AdminShell from "@/features/admin/AdminShell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <SiteShell>
      <AdminShell>{children}</AdminShell>
    </SiteShell>
  );
}
