import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lucerocris.sgp1.cdn.digitaloceanspaces.com",
      },
      // Add this new pattern to match your error asset URL:
      {
        protocol: "https",
        hostname: "lucerocris.sgp1.digitaloceanspaces.com",
      }
    ],
  },
};

export default nextConfig;