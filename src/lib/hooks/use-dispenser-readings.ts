import { dispenserReadingsApi } from "@/lib/api/dispenser-readings"
import { CreateDispenserReadingInput } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useDispenserReadings(params?: {
  page?: number
  limit?: number
  dispenserId?: string
  tankerId?: string
  branchId?: string
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: ["dispenser-readings", params],
    queryFn: () => dispenserReadingsApi.list(params),
  })
}

export function useCreateDispenserReading() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDispenserReadingInput) => dispenserReadingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispenser-readings"] })
      queryClient.invalidateQueries({ queryKey: ["tankers"] })
      toast.success("Reading recorded successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record reading")
    },
  })
}

export function useDeleteDispenserReading() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dispenserReadingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispenser-readings"] })
      queryClient.invalidateQueries({ queryKey: ["tankers"] })
      toast.success("Reading deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete reading")
    },
  })
}
