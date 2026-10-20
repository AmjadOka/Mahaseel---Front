import { Suspense } from "react";
import { getT } from "@/lib/i18n/server";
import VerifyForm from "@/features/auth/verify/VerifyForm";
import dict from "@/features/auth/verify/verify.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle") };
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
