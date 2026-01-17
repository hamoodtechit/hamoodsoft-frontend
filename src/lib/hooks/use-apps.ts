"use client"

import { businessApi } from "@/lib/api/business"
import { SelectAppsInput } from "@/lib/validations/apps"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { toast } from "sonner"

export function useSelectApps() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || "en"
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SelectAppsInput) => businessApi.selectApps(data),
    onSuccess: () => {
      // Onboarding status is now based on user.currentBusinessId, no need to invalidate
      toast.success("Apps selected successfully!")
      router.push(`/${locale}/dashboard`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Failed to select apps. Please try again."
      toast.error(message)
    },
  })
}
