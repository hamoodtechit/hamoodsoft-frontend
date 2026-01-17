import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale using the new API (next-intl 3.22+)
  // requestLocale is already a Promise, so we await it directly
  let locale = await requestLocale

  // Validate locale and ensure it's from routing
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
