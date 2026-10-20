import { getT } from "@/lib/i18n/server";
import BankAccounts from "@/features/merchant/wallet/BankAccounts";
import dict from "@/features/merchant/wallet/bank.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <BankAccounts />;
}
