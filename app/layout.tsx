import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Absolute base for canonical/OG URLs. Set NEXT_PUBLIC_SITE_URL in production;
 * without it, Open Graph images resolve relative and social cards break. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nookph.app";

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
