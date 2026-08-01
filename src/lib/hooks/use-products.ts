import { productsApi, type ProductsListParams } from "@/lib/api/products"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"
import { Product } from "@/types"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

export function useProducts(params?: ProductsListParams) {
  // Create a stable query key that includes all relevant params
  const branchId = params?.branchId
  const queryKey = [
    "products",
    params?.search ?? "",
    params?.categoryId ?? null,
    params?.unitId ?? null,
    branchId ?? null,
  ] as const

  return useQuery({
    queryKey: [...queryKey, params?.page ?? 1, params?.limit ?? 10],
    queryFn: () => productsApi.getProducts(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useInfiniteProducts(params?: Omit<ProductsListParams, "page">) {
  const queryKey = [
    "products-infinite",
    params?.search ?? "",
    params?.categoryId ?? null,
    params?.unitId ?? null,
    params?.branchId ?? null,
  ] as const

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => 
      productsApi.getProducts({ ...params, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta || {}
      if (page && totalPages && page < totalPages) {
        return page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 0, // Always refetch on mount to show latest data
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
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] })
      toast.success("Product created successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to create product. Please try again."))
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
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] })
      queryClient.invalidateQueries({ queryKey: ["product", updatedProduct.id] })
      toast.success("Product updated successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to update product. Please try again."))
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] })
      toast.success("Product deleted successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to delete product. Please try again."))
    },
  })
}

