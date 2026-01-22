"use client"

import { productsApi, type ProductsListParams } from "@/lib/api/products"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"
import { Product } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useProducts(params?: ProductsListParams) {
  // Create a stable query key that includes all relevant params
  // This ensures React Query properly detects changes and refetches
  // Always include branchId explicitly (even if undefined) so React Query detects changes
  const branchId = params?.branchId
  const queryKey = [
    "products",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.categoryId ?? null,
    params?.unitId ?? null,
    branchId ?? null, // Explicitly include branchId (null if undefined) so changes trigger refetch
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => productsApi.getProducts(params),
    // Refetch when window regains focus to ensure fresh data
    refetchOnWindowFocus: true,
    // Don't cache stale data - always refetch when query key changes
    staleTime: 0,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getProductById(id!),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductInput) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create product. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (updatedProduct: Product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", updatedProduct.id] })
      toast.success("Product updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update product. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete product. Please try again."
      toast.error(message)
    },
  })
}

