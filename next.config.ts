import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* Performance & experimental features */
  experimental: {
    // reactCompiler: true, // Enable when stable
  },

  /* Image optimization */
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  /* Logging — useful for debugging fetch calls in development */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  /* TypeScript strict mode — fail build on type errors */
  typescript: {
    // Set to true to skip type checking during build (not recommended for production)
    ignoreBuildErrors: false,
  },

  /* Redirect root to login */
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },

  /* Docker standalone output */
  output: "standalone",
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
    reactComponentAnnotation: {
      enabled: true,
    },
  }
);
