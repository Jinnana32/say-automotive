import type { Metadata } from "next";
import { Barlow_Condensed, Space_Grotesk } from "next/font/google";
import "./globals.css";

import { AppProviders } from "@/components/shared/providers/app-providers";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "SAY Auto Care Center",
  description: "SAY Auto Care Center website and workshop operations system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
