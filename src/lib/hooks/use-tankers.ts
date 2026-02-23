import { tankersApi } from "@/lib/api/tankers";
import { CreateTankerInput, UpdateTankerInput } from "@/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useTankers(params?: { page?: number; limit?: number; search?: string }) {
  const queryKey = ["tankers", params?.search ?? ""] as const

  return useQuery({
    queryKey: [...queryKey, params?.page ?? 1, params?.limit ?? 10],
    queryFn: () => tankersApi.list(params),
  })
}

export function useInfiniteTankers(params?: { limit?: number; search?: string }) {
  const queryKey = ["tankers-infinite", params?.search ?? ""] as const

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      tankersApi.list({ ...params, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta || {}
      if (page && totalPages && page < totalPages) {
        return page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTanker(id: string) {
  return useQuery({
    queryKey: ["tanker", id],
    queryFn: () => tankersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateTanker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTankerInput) => tankersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tankers"] })
      toast.success("Tanker created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tanker")
    },
  })
}

export function useUpdateTanker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTankerInput }) => tankersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tankers"] })
      queryClient.invalidateQueries({ queryKey: ["tanker", id] })
      toast.success("Tanker updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update tanker")
    },
  })
}

export function useDeleteTanker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tankersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tankers"] })
      toast.success("Tanker deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete tanker")
    },
  })
}
