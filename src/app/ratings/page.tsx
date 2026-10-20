import { getT } from "@/lib/i18n/server";
import RatingsPage from "@/features/ratings/RatingsPage";
import dict from "@/features/ratings/ratings.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <RatingsPage />;
}
