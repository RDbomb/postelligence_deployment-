import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Why we built Postelligence."
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
