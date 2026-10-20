import { adminMeta } from "@/features/admin/meta";
import AdminUsers from "@/features/admin/users/AdminUsers";

export const generateMetadata = adminMeta("navUsers");

export default function Page() {
  return <AdminUsers />;
}
