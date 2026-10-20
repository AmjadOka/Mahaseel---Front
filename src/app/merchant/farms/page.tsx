import { getT } from "@/lib/i18n/server";
import FarmsList from "@/features/merchant/farms/FarmsList";
import dict from "@/features/merchant/farms/farms.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <FarmsList />;
}
