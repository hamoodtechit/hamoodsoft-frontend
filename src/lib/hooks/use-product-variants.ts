"use client"

import { productVariantsApi } from "@/lib/api/product-variants"
import {
    CreateProductVariantInput,
    UpdateProductVariantInput,
} from "@/lib/validations/product-variants"
import { ProductVariant } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

export function useProductVariants(productId: string | undefined) {
  return useQuery({
    queryKey: ["productVariants", productId],
    queryFn: () => productVariantsApi.listByProduct(productId!),
    enabled: !!productId,
  })
}

export function useCreateProductVariant(productId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductVariantInput) => productVariantsApi.create(productId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants", productId] })
      toast.success("Variant created successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to create variant. Please try again."))
    },
  })
}

export function useUpdateProductVariant(productId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductVariantInput }) =>
      productVariantsApi.update(id, data),
    onSuccess: (updated: ProductVariant) => {
      queryClient.invalidateQueries({ queryKey: ["productVariants", productId] })
      queryClient.invalidateQueries({ queryKey: ["productVariant", updated.id] })
      toast.success("Variant updated successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to update variant. Please try again."))
    },
  })
}

export function useDeleteProductVariant(productId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productVariantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants", productId] })
      toast.success("Variant deleted successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to delete variant. Please try again."))
    },
  })
}

