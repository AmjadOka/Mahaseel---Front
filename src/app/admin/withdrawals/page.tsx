import { Suspense } from "react";
import { adminMeta } from "@/features/admin/meta";
import AdminWithdrawals from "@/features/admin/withdrawals/AdminWithdrawals";

export const generateMetadata = adminMeta("navWithdrawals");

export default function Page() {
  return (
    <Suspense>
      <AdminWithdrawals />
    </Suspense>
  );
}
