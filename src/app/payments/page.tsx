import { getT } from "@/lib/i18n/server";
import PaymentsPage from "@/features/payments/PaymentsPage";
import dict from "@/features/payments/payments.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("histMeta"), robots: { index: false } };
}

export default function Page() {
  return <PaymentsPage />;
}
