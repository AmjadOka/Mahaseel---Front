import type { ReactNode } from "react";
import Footer from "./footer/Footer";
import Header from "./header/Header";

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="min-h-[70dvh]">
        {children}
      </main>
      <Footer />
    </>
  );
}
