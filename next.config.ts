import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
