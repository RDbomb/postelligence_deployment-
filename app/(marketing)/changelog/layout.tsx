import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in Postelligence."
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
