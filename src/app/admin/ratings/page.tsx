import { adminMeta } from "@/features/admin/meta";
import AdminRatings from "@/features/admin/ratings/AdminRatings";

export const generateMetadata = adminMeta("navRatings");

export default function Page() {
  return <AdminRatings />;
}
