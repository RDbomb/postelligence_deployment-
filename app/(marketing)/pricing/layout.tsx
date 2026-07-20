import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans that scale with your publishing."
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
