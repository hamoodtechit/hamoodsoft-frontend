"use client"

import { settingsApi } from "@/lib/api/settings"
import { UpdateSettingInput } from "@/lib/validations/settings"
import { Setting } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

export function useSettings(enabled: boolean = true) {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.getSettings(),
    enabled, // Only fetch if enabled
    retry: false, // Don't retry on 401 errors
  })
}

export function useSetting(id: string | undefined) {
  return useQuery({
    queryKey: ["setting", id],
    queryFn: async () => {
      const result = await settingsApi.getSettings()
      return result.items.find((s) => s.id === id)
    },
    enabled: !!id,
  })
}

export function useUpdateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettingInput }) =>
      settingsApi.updateSetting(id, data),
    onSuccess: (updated: Setting) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      queryClient.invalidateQueries({ queryKey: ["setting", updated.id] })
      toast.success("Setting updated successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to update setting. Please try again."))
    },
  })
}

export function useCreateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; configs: Record<string, unknown> }) =>
      settingsApi.createSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      toast.success("Setting created successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to create setting. Please try again."))
    },
  })
}
