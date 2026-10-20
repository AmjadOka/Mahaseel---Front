import Link from "next/link";
import StarRating from "@/components/stars/StarRating";
import { cld } from "@/lib/cloudinary";
import { getT } from "@/lib/i18n/server";
import { getSellerProfile } from "@/features/sellers/seller-api";
import dict from "./seller.i18n";

/** Public seller summary. Renders nothing if the profile can't be read. */
export default async function SellerCard({ merchantId }: { merchantId?: string }) {
  if (!merchantId) return null;
  const s = await getSellerProfile(merchantId);
  if (!s) return null;
  const t = await getT(dict);

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold">{t("title")}</h2>
      <Link href={`/sellers/${merchantId}`} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-grove">
        {s.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
          <img src={cld(s.avatar, 120)} alt="" className="size-14 rounded-full object-cover" />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-grove text-xl font-bold text-on-solid">{s.name.charAt(0).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="line-clamp-1 font-medium">{s.name}</p>
          {s.avg !== null && s.avg > 0 ? (
            <p className="flex items-center gap-2">
              <StarRating value={s.avg} size="size-4" />
              <span className="figure text-sm text-muted">{t("ratings", { n: s.count })}</span>
            </p>
          ) : (
            <p className="text-sm text-muted">{t("noRatings")}</p>
          )}
        </div>
      </Link>
    </section>
  );
}
