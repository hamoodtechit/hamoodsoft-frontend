import { defineRouting } from "next-intl/routing"
import { config } from "@/constants/config"

export const routing = defineRouting({
  locales: config.i18n.locales,
  defaultLocale: config.i18n.defaultLocale,
  localePrefix: "always",
})
