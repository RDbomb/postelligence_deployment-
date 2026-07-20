import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Action completed",
  description: "Your automation action has been recorded.",
  robots: { index: false, follow: false }
};

export default function ActionCompletedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
