import Header from "@/components/site/header/Header";
import Hero from "@/features/landing/hero/Hero";
import Models from "@/features/landing/models/Models";
import Flow from "@/features/landing/flow/Flow";
import Merchants from "@/features/landing/merchants/Merchants";
import Cta from "@/features/landing/cta/Cta";
import Footer from "@/components/site/footer/Footer";
import RedirectIfSignedIn from "@/features/landing/RedirectIfSignedIn";
import SignedOutOnly from "@/features/landing/SignedOutOnly";

export default function Home() {
  return (
    <>
      <RedirectIfSignedIn />
      <Header />
      <main id="main">
        <SignedOutOnly>
          <Hero />
          <Models />
          <Flow />
          <Merchants />
          <Cta />
        </SignedOutOnly>
      </main>
      <Footer />
    </>
  );
}
