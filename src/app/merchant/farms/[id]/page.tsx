import { getT } from "@/lib/i18n/server";
import FarmEditor from "@/features/merchant/farms/FarmEditor";
import dict from "@/features/merchant/farms/farms.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaEdit"), robots: { index: false } };
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  return <FarmEditor id={id} justCreated={sp.created === "1"} />;
}
