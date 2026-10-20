import { Suspense } from "react";
import { adminMeta } from "@/features/admin/meta";
import AdminProducts from "@/features/admin/products/AdminProducts";

export const generateMetadata = adminMeta("navProducts");

export default function Page() {
  return (
    <Suspense>
      <AdminProducts />
    </Suspense>
  );
}
