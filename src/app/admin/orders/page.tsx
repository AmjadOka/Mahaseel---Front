import { Suspense } from "react";
import { adminMeta } from "@/features/admin/meta";
import AdminOrders from "@/features/admin/orders/AdminOrders";

export const generateMetadata = adminMeta("navOrders");

export default function Page() {
  return (
    <Suspense>
      <AdminOrders />
    </Suspense>
  );
}
