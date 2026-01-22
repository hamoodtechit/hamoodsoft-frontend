"use client"

import { productsApi, type ProductsListParams } from "@/lib/api/products"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"
import { Product } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useProducts(params?: ProductsListParams) {
  // Create a stable query key that includes all relevant params
  // This ensures React Query properly detects changes and refetches
  const queryKey = [
    "products",
    params?.page,
    params?.limit,
    params?.search,
    params?.categoryId,
    params?.unitId,
    params?.branchId, // Explicitly include branchId so changes trigger refetch
  ]

  return useQuery({
    queryKey,
    queryFn: () => productsApi.getProducts(params),
    // Refetch when window regains focus to ensure fresh data
    refetchOnWindowFocus: true,
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

