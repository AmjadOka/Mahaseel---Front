import { Suspense } from "react";
import { getT } from "@/lib/i18n/server";
import LoginForm from "@/features/auth/login/LoginForm";
import dict from "@/features/auth/login/login.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle") };
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
