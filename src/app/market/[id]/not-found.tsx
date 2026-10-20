import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import dict from "@/features/market/states.i18n";

export default async function ProductNotFound() {
  const t = await getT(dict);
  return (
    <div className="wrap grid place-items-center py-24 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("notFoundTitle")}</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">{t("notFoundText")}</p>
        <Link href="/market" className="btn btn-solid mt-8">
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
