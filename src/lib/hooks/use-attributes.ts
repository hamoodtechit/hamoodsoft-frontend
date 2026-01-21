"use client"

import { attributesApi } from "@/lib/api/attributes"
import { CreateAttributeInput, UpdateAttributeInput } from "@/lib/validations/attributes"
import { Attribute } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useAttributes(productId: string | undefined) {
  return useQuery({
    queryKey: ["attributes", productId],
    queryFn: () => attributesApi.listByProduct(productId!),
    enabled: !!productId,
  })
}

export function useCreateAttribute(productId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAttributeInput) => attributesApi.create(productId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes", productId] })
      toast.success("Attribute created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create attribute. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateAttribute(productId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttributeInput }) =>
      attributesApi.update(id, data),
    onSuccess: (updated: Attribute) => {
      queryClient.invalidateQueries({ queryKey: ["attributes", productId] })
      queryClient.invalidateQueries({ queryKey: ["attribute", updated.id] })
      toast.success("Attribute updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update attribute. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteAttribute(productId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => attributesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes", productId] })
      toast.success("Attribute deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete attribute. Please try again."
      toast.error(message)
    },
  })
}

