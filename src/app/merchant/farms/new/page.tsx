import { getT } from "@/lib/i18n/server";
import { BackToFarms } from "@/features/merchant/farms/FarmEditor";
import FarmForm from "@/features/merchant/farms/FarmForm";
import dict from "@/features/merchant/farms/farms.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaNew"), robots: { index: false } };
}

export default async function Page() {
  const t = await getT(dict);
  return (
    <div>
      <BackToFarms />
      <h1 className="mb-6 font-display text-3xl font-bold">{t("newTitle")}</h1>
      <FarmForm />
    </div>
  );
}
