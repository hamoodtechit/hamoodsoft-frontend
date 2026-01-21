import {
    CreateProductVariantInput,
    UpdateProductVariantInput,
} from "@/lib/validations/product-variants"
import { ApiResponse, PaginatedResult, ProductVariant } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

type ProductVariantsResponseShape = {
  items: ProductVariant[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

function normalizeVariantsList(
  data: PaginatedResult<ProductVariant> | ProductVariantsResponseShape | ProductVariant[]
): PaginatedResult<ProductVariant> {
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

  if (!Array.isArray(data) && "meta" in data && "items" in data) {
    return data as PaginatedResult<ProductVariant>
  }

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

export const productVariantsApi = {
  create: async (productId: string, data: CreateProductVariantInput): Promise<ProductVariant> => {
    const response = await apiClient.post<ApiResponse<ProductVariant>>(
      endpoints.productVariants.create(productId),
      data
    )
    return response.data.data
  },

  listByProduct: async (productId: string): Promise<PaginatedResult<ProductVariant>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<ProductVariant> | ProductVariantsResponseShape | ProductVariant[]>>(
      endpoints.productVariants.listByProduct(productId)
    )
    return normalizeVariantsList(response.data.data)
  },

  getById: async (id: string): Promise<ProductVariant> => {
    const response = await apiClient.get<ApiResponse<ProductVariant>>(
      endpoints.productVariants.getById(id)
    )
    return response.data.data
  },

  update: async (id: string, data: UpdateProductVariantInput): Promise<ProductVariant> => {
    const response = await apiClient.patch<ApiResponse<ProductVariant>>(
      endpoints.productVariants.update(id),
      data
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.productVariants.delete(id))
  },
}

