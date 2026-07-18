import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postelligence",
  description: "Create once, publish everywhere, and let AI keep your content moving."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
