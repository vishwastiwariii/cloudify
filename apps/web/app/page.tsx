import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/landing/hero";
import { FileStrip } from "@/components/landing/file-strip";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_60%_45%_at_80%_12%,color-mix(in_srgb,var(--color-gold-soft)_55%,transparent),transparent)]">
      <Navbar />
      <main>
        <Hero />
        <FileStrip />
      </main>
    </div>
  );
}
