"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { settingsApi } from "@/lib/api/settings"
import { useUIStore } from "@/store/use-ui-store"
import { useAuthStore } from "@/store"

export function SettingsSync() {
  const { setBgImageUrl } = useUIStore()
  const { user, isAuthenticated } = useAuthStore()

  // Only fetch if authenticated and user has a business
  const shouldFetch = !!isAuthenticated && !!user?.currentBusinessId

  const { data: uiSettings } = useQuery({
    queryKey: ["settings", "ui_preferences", user?.currentBusinessId],
    queryFn: () => settingsApi.getSettingByName("ui_preferences"),
    enabled: shouldFetch,
    staleTime: Infinity, // Don't refetch automatically to prevent flashes
    retry: false, // Don't retry if it doesn't exist (404)
  })

  // Sync to store when data is loaded
  useEffect(() => {
    if (uiSettings?.configs) {
      setBgImageUrl((uiSettings.configs.bgImageUrl as string) || null)
    }
  }, [uiSettings, setBgImageUrl])

  return null
}
