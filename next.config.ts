import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    proxyClientMaxBodySize: '50mb',
  },
};

export default nextConfig;
