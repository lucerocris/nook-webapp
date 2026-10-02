import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import { SITE_URL } from "@/lib/env";
import { BASE_OPEN_GRAPH, SITE_TITLE } from "@/lib/seo/metadata";

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
    default: SITE_TITLE,
    template: "%s · Nook",
  },
  description:
    "Find the perfect spot to work, study, or chill. Filter cafes by Wi-Fi, outlets, and vibe, or ask our AI to find your match.",
  applicationName: "Nook",
  /* Same mark and same mechanism as nook-business, so the two sites share one
     favicon. Declared here rather than as an `app/favicon.ico` file convention
     — that convention wins over metadata, and it is what kept serving
     create-next-app's Vercel triangle. */
  icons: {
    icon: "/nookGlasses.svg",
    shortcut: "/nookGlasses.svg",
    apple: "/nookGlasses.svg",
  },
  // No `alternates.canonical` or `openGraph.url` here: both are inherited by
  // every route that doesn't override them, which made /map (and anything else
  // without its own metadata) declare the homepage as its canonical. Each page
  // states its own.
  openGraph: BASE_OPEN_GRAPH,
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
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
