import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Brand Selector",
  description:
    "Select available length and width combinations to view the matching SKU and price.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
