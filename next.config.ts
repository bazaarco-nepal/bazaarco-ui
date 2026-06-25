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
    const ordersServiceUrl = env.ORDERS_SERVICE_URL;
    const coreApiUrl = env.NEXT_PUBLIC_BACKEND_URL;

    if (ordersServiceUrl) {
      return [
        // Exact match FIRST: bare /api/v1/orders must resolve to `.../orders`
        // (no trailing slash). If the wildcard matched it, the destination
        // becomes `.../orders/`, which FastAPI 307-redirects to an http:// URL
        // and the browser blocks as mixed-content on the https site.
        {
          source: "/api/v1/orders",
          destination: `${ordersServiceUrl}/orders`,
        },
        {
          source: "/api/v1/orders/:path+",
          destination: `${ordersServiceUrl}/orders/:path+`,
        },
        {
          source: "/api/v1/payments/:path*",
          destination: `${ordersServiceUrl}/payments/:path*`,
        },
        {
          source: "/api/v1/checkout-sessions",
          destination: `${ordersServiceUrl}/checkout-sessions`,
        },
        {
          source: "/api/v1/seller/inbox",
          destination: `${ordersServiceUrl}/seller/inbox`,
        },
        {
          source: "/api/v1/seller/orders/:path*",
          destination: `${ordersServiceUrl}/seller/orders/:path*`,
        },
        {
          source: "/api/v1/tracking/:path*",
          destination: `${ordersServiceUrl}/tracking/:path*`,
        },
        {
          source: "/api/v1/:path*",
          destination: `${coreApiUrl}/api/v1/:path*`,
        },
      ];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${coreApiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
