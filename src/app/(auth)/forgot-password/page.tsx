import { getT } from "@/lib/i18n/server";
import ForgotForm from "@/features/auth/forgot/ForgotForm";
import dict from "@/features/auth/forgot/forgot.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle") };
}

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
