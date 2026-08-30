import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/config.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // Enable standalone output for Docker
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/demo-pump",
        destination: "/en/magic-login?key=demo-pump",
        permanent: false,
      },
      {
        source: "/demo/:key",
        destination: "/en/magic-login?key=:key",
        permanent: false,
      }
    ];
  },
};

export default withNextIntl(nextConfig);
