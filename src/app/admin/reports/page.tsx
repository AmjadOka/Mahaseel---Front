import { adminMeta } from "@/features/admin/meta";
import Reports from "@/features/admin/reports/Reports";

export const generateMetadata = adminMeta("navReports");

export default function Page() {
  return <Reports />;
}
