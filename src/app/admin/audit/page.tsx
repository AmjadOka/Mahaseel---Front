import { adminMeta } from "@/features/admin/meta";
import AuditLog from "@/features/admin/audit/AuditLog";

export const generateMetadata = adminMeta("navAudit");

export default function Page() {
  return <AuditLog />;
}
