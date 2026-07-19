import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import { SITE_URL } from "@/lib/env";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Re-exported for existing callers. The value lives in lib/env so that
 * robots.ts and sitemap.ts can read it without importing this module — they
 * need one string, and importing the layout drags next/font and the whole
 * Navbar client tree into two metadata routes. */
export const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nook — Philippine cafes, community curated",
    template: "%s · Nook",
  },
  description:
    "Find the perfect spot to work, study, or chill. Filter cafes by Wi-Fi, outlets, and vibe, or ask our AI to find your match.",
  applicationName: "Nook",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Nook",
    url: "/",
    title: "Nook — Philippine cafes, community curated",
    description:
      "Find the perfect spot to work, study, or chill. Filter cafes by Wi-Fi, outlets, and vibe.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nook — Philippine cafes, community curated",
    description:
      "Find the perfect spot to work, study, or chill. Filter cafes by Wi-Fi, outlets, and vibe.",
  },
};

function NavbarFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-transparent bg-transparent" />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<NavbarFallback />}>
          <Navbar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
