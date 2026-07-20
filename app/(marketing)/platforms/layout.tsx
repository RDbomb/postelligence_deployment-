import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platforms",
  description: "Every social platform Postelligence publishes to."
};

export default function PlatformsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
