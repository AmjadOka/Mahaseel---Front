import Link from "next/link";
import { notFound } from "next/navigation";
import { cld } from "@/lib/cloudinary";
import { getT } from "@/lib/i18n/server";
import StarRating from "@/components/stars/StarRating";
import { getSellerProfile } from "@/features/sellers/seller-api";
import SellerReviews from "@/features/sellers/SellerReviews";
import dict from "@/features/sellers/sellers.i18n";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const [{ id }, t] = await Promise.all([params, getT(dict)]);
  const s = UUID.test(id) ? await getSellerProfile(id) : null;
  return { title: `${s?.name ?? t("brand")} | ${t("brand")}`, description: s?.bio?.slice(0, 160) };
}

export default async function SellerPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [s, t] = await Promise.all([getSellerProfile(id), getT(dict)]);
  if (!s) notFound();

  return (
    <div className="wrap max-w-3xl py-10 lg:py-14">
      <header className="flex flex-wrap items-center gap-5">
        {s.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
          <img src={cld(s.avatar, 240)} alt="" className="size-24 rounded-full object-cover" />
        ) : (
          <span className="grid size-24 place-items-center rounded-full bg-grove text-3xl font-bold text-on-solid">{s.name.charAt(0).toUpperCase()}</span>
        )}
        <div>
          <h1 className="font-display text-3xl font-bold">{s.name}</h1>
          {s.avg !== null && s.avg > 0 ? (
            <p className="mt-1 flex items-center gap-2">
              <StarRating value={s.avg} />
              <span className="figure text-sm text-muted">{t("ratings", { n: s.count })}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">{t("noRatings")}</p>
          )}
        </div>
      </header>
      {s.bio && <p className="mt-6 max-w-prose whitespace-pre-line text-muted">{s.bio}</p>}

      <h2 className="mb-4 mt-12 font-display text-xl font-bold">{t("reviews")}</h2>
      <SellerReviews userId={id} />

      <Link href="/market" className="mt-10 inline-block text-sm font-medium text-grove hover:underline">
        {t("market")}
      </Link>
    </div>
  );
}
