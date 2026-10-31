import type { NextConfig } from "next";

const apiOrigin = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // The Playwright smoke test uses its own build directory so it can run next to a normal `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${apiOrigin}/api/:path*`,
        },
      ],
    };
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
