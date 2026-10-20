import { getT } from "@/lib/i18n/server";
import ProductBids from "@/features/merchant/products/ProductBids";
import dict from "@/features/merchant/products/products.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaBids"), robots: { index: false } };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductBids productId={id} />;
}
