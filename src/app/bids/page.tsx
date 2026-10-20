import { getT } from "@/lib/i18n/server";
import MyBids from "@/features/bids/MyBids";
import dict from "@/features/bids/bids.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <MyBids />;
}
