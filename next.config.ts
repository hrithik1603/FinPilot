import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    middlewareClientMaxBodySize: '50mb',
  },
};

export default nextConfig;
