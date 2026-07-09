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

export const metadata: Metadata = {
  title: "Nook",
  description: "Find your perfect study cafe.",
};

function NavbarFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-transparent bg-transparent" />
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
