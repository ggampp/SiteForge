import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteForge Template",
  description: "Next.js + Tailwind scaffold for SiteForge rebuilds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
