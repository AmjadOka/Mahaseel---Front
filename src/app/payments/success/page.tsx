import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import dict from "@/features/payments/payments.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("successMeta"), robots: { index: false } };
}

export default async function PaymentSuccessPage() {
  const t = await getT(dict);
  return (
    <div className="wrap grid place-items-center py-24 text-center">
      <div>
        <CircleCheck className="mx-auto size-14 text-grove" aria-hidden="true" />
        <h1 className="mt-6 font-display text-3xl font-bold">{t("successTitle")}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{t("successBody")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/orders" className="btn btn-solid">
            {t("toOrders")}
          </Link>
          <Link href="/market" className="btn btn-line">
            {t("browse")}
          </Link>
        </div>
      </div>
    </div>
  );
}
