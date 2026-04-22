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
  turbopack: {
    root: '/home/z/my-project',
    resolveAlias: {
      '~@/': './src/',
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias['~@/'] = '/home/z/my-project/src/';
    return config;
  },
};

export default nextConfig;
