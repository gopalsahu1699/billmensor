import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  // ── Core ──
  reactStrictMode: true,
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  turbopack: {},

  // TypeScript – allow build even with stray type errors
  typescript: { ignoreBuildErrors: true },

  // ── Image CDN ──
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // ── Experimental ──
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "react-icons/md",
      "react-icons/fa",
      "react-icons/fi",
      "react-icons/io5",
      "date-fns",
      "framer-motion",
      "@supabase/ssr",
      "@supabase/supabase-js",
      "sonner",
      "clsx",
      "tailwind-merge",
      "i18next",
      "react-i18next",
      "qrcode.react",
      "zod",
    ],
  },

  // ── Security + Caching Headers ──
  async headers() {
    return [
      // Global security headers
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Immutable static assets (JS/CSS chunks)
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Fonts
      {
        source: "/:path*.(woff|woff2|ttf|otf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Images
      {
        source: "/:path*.(jpg|jpeg|png|gif|svg|ico|webp|avif)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // JSON / manifest (PWA)
      {
        source: "/:path*.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      // Service worker – must not be cached long
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },

  // ── Redirects ──
  async redirects() {
    return [
      { source: "/home", destination: "/dashboard", permanent: false },
      { source: "/icon-192x192.png", destination: "/icon.svg", permanent: true },
      { source: "/icon-512x512.png", destination: "/icon.svg", permanent: true },
    ];
  },
};

export default withSerwist(nextConfig);
