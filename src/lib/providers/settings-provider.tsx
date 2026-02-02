"use client"

import { useSettings } from "@/lib/hooks/use-settings"
import { Setting } from "@/types"
import { createContext, useContext, useMemo, ReactNode } from "react"
import { useAuthStore } from "@/store"
import { usePathname } from "next/navigation"

interface SettingsContextValue {
  settings: Setting[]
  isLoading: boolean
  // Helper functions to get specific settings
  getSetting: (name: string) => Setting | undefined
  getSettingConfig: (name: string) => Record<string, any> | null
  // Specific setting getters
  generalSettings: {
    logoUrl?: string
    currency?: { code: string; name: string; symbol: string }
    timeZone?: string
    currencySymbolPlacement?: "before-amount" | "after-amount"
  } | null
  taxSettings: {
    name?: string
    rate?: number
  } | null
  invoiceSettings: {
    prefix?: string
    startNumber?: number
    layout?: string
    footer?: string
  } | null
  emailSettings: Record<string, any> | null
  smsSettings: Record<string, any> | null
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, token, user } = useAuthStore()
  
  // Only fetch settings if user is authenticated and not on login/register pages
  const isAuthPage = pathname?.includes("/login") || 
                     pathname?.includes("/register") || 
                     pathname?.includes("/forgot-password") || 
                     pathname?.includes("/reset-password")
  
  // Ensure boolean conversion - use !! to convert to strict boolean
  const shouldFetchSettings = !isAuthPage && !!(isAuthenticated || (token && user?.id))
  
  const { data, isLoading } = useSettings(shouldFetchSettings)
  const settings = data?.items ?? []

  const value = useMemo(() => {
    const getSetting = (name: string): Setting | undefined => {
      return settings.find((s) => s.name === name)
    }

    const getSettingConfig = (name: string): Record<string, any> | null => {
      const setting = getSetting(name)
      return setting?.configs || null
    }

    // Get general settings
    const generalConfig = getSettingConfig("general")
    const generalSettings = generalConfig
      ? {
          logoUrl: generalConfig.logoUrl || undefined,
          currency: generalConfig.currency || undefined,
          timeZone: generalConfig.timeZone || undefined,
          currencySymbolPlacement: generalConfig.currencySymbolPlacement || "before-amount",
        }
      : null

    // Get tax settings
    const taxConfig = getSettingConfig("taxRate")
    const taxSettings = taxConfig
      ? {
          name: taxConfig.name || undefined,
          rate: taxConfig.rate ?? undefined,
        }
      : null

    // Get invoice settings
    const invoiceConfig = getSettingConfig("invoice")
    const invoiceSettings = invoiceConfig
      ? {
          prefix: invoiceConfig.prefix || "INV",
          startNumber: invoiceConfig.startNumber ?? 1000,
          layout: invoiceConfig.layout || "pos-80mm",
          footer: invoiceConfig.footer || "",
        }
      : null

    // Get email settings
    const emailSettings = getSettingConfig("email")

    // Get SMS settings
    const smsSettings = getSettingConfig("sms")

    return {
      settings,
      isLoading,
      getSetting,
      getSettingConfig,
      generalSettings,
      taxSettings,
      invoiceSettings,
      emailSettings,
      smsSettings,
    }
  }, [settings, isLoading])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useAppSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useAppSettings must be used within a SettingsProvider")
  }
  return context
}
