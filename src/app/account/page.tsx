import { getT } from "@/lib/i18n/server";
import AccountPage from "@/features/account/AccountPage";
import dict from "@/features/account/account.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <AccountPage />;
}
