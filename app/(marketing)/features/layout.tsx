import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything Postelligence does, in one place."
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
