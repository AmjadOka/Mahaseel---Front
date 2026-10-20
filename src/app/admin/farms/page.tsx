import { Suspense } from "react";
import { adminMeta } from "@/features/admin/meta";
import AdminFarms from "@/features/admin/farms/AdminFarms";

export const generateMetadata = adminMeta("navFarms");

export default function Page() {
  return (
    <Suspense>
      <AdminFarms />
    </Suspense>
  );
}
