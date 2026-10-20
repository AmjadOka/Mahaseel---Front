import { getT } from "@/lib/i18n/server";
import ProductsList from "@/features/merchant/products/ProductsList";
import dict from "@/features/merchant/products/products.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <ProductsList />;
}
