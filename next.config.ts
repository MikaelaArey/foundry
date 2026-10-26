import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  devIndicators: false,
  // The idea generator was removed; send old links to the Idea Database.
  redirects: async () => [{ source: "/app/generate", destination: "/explore", permanent: false }],
};

export default nextConfig;
