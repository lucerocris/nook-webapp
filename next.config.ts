import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const remotePatterns = [
  {
    protocol: "https" as const,
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https" as const,
    hostname: "*.digitaloceanspaces.com",
  },
];

if (supabaseHost && supabaseHost.endsWith(".supabase.co")) {
  remotePatterns.push(
    { protocol: "https" as const, hostname: supabaseHost },
    { protocol: "https" as const, hostname: "*.supabase.co" },
  );
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
