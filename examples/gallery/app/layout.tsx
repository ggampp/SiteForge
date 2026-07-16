import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteForge Example Clones",
  description: "Working SiteForge rebuilds of authorized demo sites",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
