import type { NextConfig } from "next";

import { env } from "./src/config/env";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production" && !process.env.VERCEL ? ".next-prod" : ".next",
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${env.NEXT_PUBLIC_BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
