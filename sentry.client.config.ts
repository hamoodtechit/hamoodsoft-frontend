import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_ENABLE_GLITCHTIP === 'true') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Tracing
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

    // Enable debug logs in development to verify events are being sent
    debug: process.env.NODE_ENV === 'development',

    // Client Tunnel for Adblocker Bypass
    tunnel: '/api/glitchtip-tunnel',
  });
}
