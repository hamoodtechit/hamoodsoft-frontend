const requireEnv = (name: string, value?: string) => {
  if (!value) {
    throw new Error(`Environment variable ${name} is missing. Please ensure it is set in your .env or deployment configuration.`);
  }
  return value;
};

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "Patwary Pump",
    url: requireEnv("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL),
  },
  api: {
    baseUrl: requireEnv("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL),
    timeout: 30000,
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "bn"] as const,
  },
} as const

export type Locale = (typeof config.i18n.locales)[number]
