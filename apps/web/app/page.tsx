import { ScrollProgressBar } from "@/components/landing/scroll-progress-bar";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/landing/hero";
import { FileStrip } from "@/components/landing/file-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Sharing } from "@/components/landing/sharing";
import { Features } from "@/components/landing/features";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <ScrollProgressBar />
      <Navbar />
      <main>
        <Hero />
        <FileStrip />
        <HowItWorks />
        <Sharing />
        <Features />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
