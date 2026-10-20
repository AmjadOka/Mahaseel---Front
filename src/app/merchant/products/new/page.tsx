import { getT } from "@/lib/i18n/server";
import { BackToProducts } from "@/features/merchant/products/ProductEditor";
import ProductForm from "@/features/merchant/products/ProductForm";
import dict from "@/features/merchant/products/products.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaNew"), robots: { index: false } };
}

export default async function Page() {
  const t = await getT(dict);
  return (
    <div>
      <BackToProducts />
      <h1 className="mb-6 font-display text-3xl font-bold">{t("newTitle")}</h1>
      <ProductForm />
    </div>
  );
}
