import { adminMeta } from "@/features/admin/meta";
import AdminFarmDetail from "@/features/admin/farms/AdminFarmDetail";

export const generateMetadata = adminMeta("navFarms");

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminFarmDetail id={id} />;
}
