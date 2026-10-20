import { Suspense } from "react";
import { getT } from "@/lib/i18n/server";
import OrdersList from "@/features/orders/OrdersList";
import dict from "@/features/orders/orders.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
