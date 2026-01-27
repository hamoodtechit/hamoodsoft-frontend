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

function normalizeProduct(product: any): Product {
  // Normalize productVariants to variants
  if (product.productVariants && !product.variants) {
    product.variants = product.productVariants.map((pv: any) => ({
      variantName: pv.variantName,
      sku: pv.sku,
      price: pv.price,
      unitId: pv.unitId,
      options: pv.options || {},
    }))
  }
  return product as Product
}

function normalizeProductsList(data: PaginatedResult<Product> | ProductsResponseShape | Product[]): PaginatedResult<Product> {
  // If backend already returns { items, meta }
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    const items = (data.items || []).map(normalizeProduct)
    return {
      items,
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? (items.length || 10),
        total: meta.total ?? items.length ?? 0,
        totalPages: meta.totalPages ?? undefined,
      },
    }
  }

  // If backend returns full PaginatedResult with meta nested
  if (!Array.isArray(data) && "meta" in data && "items" in data) {
    const paginatedData = data as PaginatedResult<Product>
    return {
      items: paginatedData.items.map(normalizeProduct),
      meta: paginatedData.meta,
    }
  }

  // Fallback: plain array
  const items = Array.isArray(data) ? data.map(normalizeProduct) : []
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
    // Clean params - remove undefined/null/empty values
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ProductsListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }
    
    const response = await apiClient.get<ApiResponse<PaginatedResult<Product> | ProductsResponseShape | Product[]>>(
      endpoints.products.list,
      { params: cleanParams }
    )
    return normalizeProductsList(response.data.data)
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<any>>(endpoints.products.getById(id))
    return normalizeProduct(response.data.data)
  },

  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await apiClient.patch<ApiResponse<Product>>(endpoints.products.update(id), data)
    return response.data.data
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.products.delete(id))
  },
}

