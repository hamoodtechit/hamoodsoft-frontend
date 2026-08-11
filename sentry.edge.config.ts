import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_ENABLE_GLITCHTIP === "true") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    debug: process.env.NODE_ENV === "development",
  });
}
