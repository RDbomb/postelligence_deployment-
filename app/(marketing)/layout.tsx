import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ScrollProgress } from "@/components/marketing/ScrollProgress";

export const metadata: Metadata = {
  title: {
    default: "Postelligence — Create once, publish everywhere",
    template: "%s · Postelligence"
  },
  description:
    "Create once, publish everywhere, and let AI keep your content moving across LinkedIn, Instagram, YouTube, and more."
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell min-h-screen">
      <ScrollProgress />
      <Navbar />
      <main className="relative">{children}</main>
      <Footer />
    </div>
  );
}
