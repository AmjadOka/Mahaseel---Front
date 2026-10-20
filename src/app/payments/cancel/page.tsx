import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import dict from "@/features/payments/payments.i18n";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata() {
  return { title: (await getT(dict))("cancelMeta"), robots: { index: false } };
}

export default async function PaymentCancelPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [t, sp] = await Promise.all([getT(dict), searchParams]);
  const raw = Array.isArray(sp.order_id) ? sp.order_id[0] : sp.order_id;
  const orderId = raw && UUID.test(raw) ? raw : null;

  return (
    <div className="wrap grid place-items-center py-24 text-center">
      <div>
        <CircleAlert className="mx-auto size-14 text-pomegranate" aria-hidden="true" />
        <h1 className="mt-6 font-display text-3xl font-bold">{t("cancelTitle")}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{t("cancelBody")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={orderId ? `/orders/${orderId}` : "/orders"} className="btn btn-solid">
            {orderId ? t("toOrder") : t("toOrders")}
          </Link>
        </div>
      </div>
    </div>
  );
}
