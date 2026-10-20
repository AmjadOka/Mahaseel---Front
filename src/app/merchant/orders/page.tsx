import { Suspense } from "react";
import { getT } from "@/lib/i18n/server";
import MerchantOrders from "@/features/merchant/orders/MerchantOrders";
import dict from "@/features/merchant/orders/merchant-orders.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return (
    <Suspense>
      <MerchantOrders />
    </Suspense>
  );
}
