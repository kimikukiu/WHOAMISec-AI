import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['z-ai-web-dev-sdk', 'child_process'],
  outputFileTracingExcludes: {
    '*': ['./tools/**', './data/sessions/**', './downloads/**', './generated_code/**'],
  },
  turbopack: {},
};

export default nextConfig;
