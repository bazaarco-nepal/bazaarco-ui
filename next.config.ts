import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep a LOCAL `next build`/`next start` out of the dev server's `.next` dir
  // so a build run while `next dev` is live can't clobber dev manifests. On
  // Vercel (VERCEL=1) the build must stay in `.next`, which the platform reads
  // for routes-manifest.json — otherwise the deploy fails to find the output.
  distDir: process.env.NODE_ENV === "production" && !process.env.VERCEL ? ".next-prod" : ".next",
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
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
