import { getT } from "@/lib/i18n/server";
import SignupForm from "@/features/auth/signup/SignupForm";
import dict from "@/features/auth/signup/signup.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle") };
}

export default function SignupPage() {
  return <SignupForm />;
}
