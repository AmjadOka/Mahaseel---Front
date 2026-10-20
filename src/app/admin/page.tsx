import { adminMeta } from "@/features/admin/meta";
import Dashboard from "@/features/admin/dashboard/Dashboard";

export const generateMetadata = adminMeta("navDashboard");

export default function Page() {
  return <Dashboard />;
}
