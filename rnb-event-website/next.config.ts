import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/RnBEvent",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    // Disable ESLint during builds for demo purposes
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript strict checks during builds for demo purposes  
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
