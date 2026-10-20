import { adminMeta } from "@/features/admin/meta";
import AdminCategories from "@/features/admin/categories/AdminCategories";

export const generateMetadata = adminMeta("navCategories");

export default function Page() {
  return <AdminCategories />;
}
