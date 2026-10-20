import { getT } from "@/lib/i18n/server";
import OrderDetail from "@/features/orders/OrderDetail";
import dict from "@/features/orders/order-detail.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
