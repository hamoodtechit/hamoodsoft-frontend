import { dispensersApi } from "@/lib/api/dispensers"
import { CreateDispenserInput, UpdateDispenserInput } from "@/types"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useDispensers(params?: { page?: number; limit?: number; search?: string; branchId?: string; status?: string }) {
  return useQuery({
    queryKey: ["dispensers", params?.search ?? "", params?.branchId ?? "", params?.status ?? "", params?.page ?? 1, params?.limit ?? 10],
    queryFn: () => dispensersApi.list(params),
  })
}

export function useInfiniteDispensers(params?: { limit?: number; search?: string; branchId?: string; status?: string }) {
  return useInfiniteQuery({
    queryKey: ["dispensers", "infinite", params?.search ?? "", params?.branchId ?? "", params?.status ?? "", params?.limit ?? 10],
    queryFn: ({ pageParam = 1 }) => dispensersApi.list({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const morePagesExist = lastPage.items.length === (params?.limit ?? 10)
      return morePagesExist ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })
}

export function useDispenser(id: string) {
  return useQuery({
    queryKey: ["dispenser", id],
    queryFn: () => dispensersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateDispenser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDispenserInput) => dispensersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispensers"] })
      toast.success("Dispenser created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create dispenser")
    },
  })
}

export function useUpdateDispenser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDispenserInput }) => dispensersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["dispensers"] })
      queryClient.invalidateQueries({ queryKey: ["dispenser", id] })
      toast.success("Dispenser updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update dispenser")
    },
  })
}

export function useDeleteDispenser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dispensersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispensers"] })
      toast.success("Dispenser deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete dispenser")
    },
  })
}
