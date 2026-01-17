export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "Hamood Tech",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://hamood-erp.ourb.live/api",
    timeout: 30000,
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "bn"] as const,
  },
} as const

export type Locale = (typeof config.i18n.locales)[number]
