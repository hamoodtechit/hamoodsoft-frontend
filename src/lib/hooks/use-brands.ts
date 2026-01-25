"use client"

import { brandsApi, type BrandsListParams } from "@/lib/api/brands"
import { CreateBrandInput, UpdateBrandInput } from "@/lib/validations/brands"
import { Brand } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useBrands(params?: BrandsListParams) {
  return useQuery({
    queryKey: ["brands", params],
    queryFn: () => brandsApi.list(params),
  })
}

export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: () => brandsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBrandInput) => brandsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      toast.success("Brand created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create brand. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBrandInput }) =>
      brandsApi.update(id, data),
    onSuccess: (updated: Brand) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brand", updated.id] })
      toast.success("Brand updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update brand. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => brandsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      toast.success("Brand deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete brand. Please try again."
      toast.error(message)
    },
  })
}
