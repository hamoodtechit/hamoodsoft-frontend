import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"
import { ApiResponse, PaginatedResult, Product } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type ProductsListParams = {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  unitId?: string
  branchId?: string
}

type ProductsResponseShape = {
  items: Product[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

function normalizeProductsList(data: PaginatedResult<Product> | ProductsResponseShape | Product[]): PaginatedResult<Product> {
  // If backend already returns { items, meta }
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    return {
      items: data.items || [],
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? (data.items?.length || 10),
        total: meta.total ?? data.items?.length ?? 0,
        totalPages: meta.totalPages ?? undefined,
        ...meta,
      },
    }
  }

  // If backend returns full PaginatedResult with meta nested
  if (!Array.isArray(data) && "meta" in data && "items" in data) {
    return data as PaginatedResult<Product>
  }

  // Fallback: plain array
  const items = Array.isArray(data) ? data : []
  return {
    items,
    meta: {
      page: 1,
      limit: items.length || 10,
      total: items.length,
      totalPages: 1,
    },
  }
}

export const productsApi = {
  createProduct: async (data: CreateProductInput): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>(endpoints.products.create, data)
    return response.data.data
  },

  getProducts: async (params?: ProductsListParams): Promise<PaginatedResult<Product>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<Product> | ProductsResponseShape | Product[]>>(
      endpoints.products.list,
      { params }
    )
    return normalizeProductsList(response.data.data)
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(endpoints.products.getById(id))
    return response.data.data
  },

  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await apiClient.patch<ApiResponse<Product>>(endpoints.products.update(id), data)
    return response.data.data
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.products.delete(id))
  },
}

