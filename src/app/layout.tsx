import type { Metadata, Viewport } from "next";
import "@/lib/fonts";
import "./globals.css";
import { dirFor } from "@/lib/i18n/locale";
import { getServerLocale, getT } from "@/lib/i18n/server";
import QueryProvider from "@/components/providers/QueryProvider";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { themeScript } from "@/lib/theme/theme-script";
import metaDict from "./meta.i18n";

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1712" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(metaDict);
  return { title: t("title"), description: t("description"), openGraph: { title: t("title"), description: t("description"), type: "website" } };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <LocaleProvider initial={locale}>
          <QueryProvider>{children}</QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
