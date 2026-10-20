import { getT } from "@/lib/i18n/server";
import WalletPage from "@/features/merchant/wallet/WalletPage";
import dict from "@/features/merchant/wallet/wallet.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <WalletPage />;
}
