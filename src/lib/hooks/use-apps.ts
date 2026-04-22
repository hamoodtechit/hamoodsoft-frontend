"use client"

import { businessApi } from "@/lib/api/business"
import { SelectAppsInput } from "@/lib/validations/apps"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

export function useSelectApps() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || "en"

  return useMutation({
    mutationFn: (data: SelectAppsInput) => businessApi.selectApps(data),
    onSuccess: () => {
      // Onboarding status is now based on user.currentBusinessId, no need to invalidate
      toast.success("Apps selected successfully!")
      router.push(`/${locale}/dashboard`)
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to select apps. Please try again."))
    },
  })
}
