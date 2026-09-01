import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/config.ts");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
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

export default withSentryConfig(
  withNextIntl(withPWA(nextConfig)),
  {
    org: "hamoodtech",
    project: "school-frontend",
    sentryUrl: "https://glitchtip-p04osokcwgw0c4so0gkcg44g.genify.live",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Disable source map uploading since we don't have the auth token right now
    sourcemaps: {
      disable: true,
    },

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    webpack: {
      reactComponentAnnotation: {
        enabled: true,
      },
    },
  }
);
