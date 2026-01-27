import { CreateBrandInput, UpdateBrandInput } from "@/lib/validations/brands"
import { ApiResponse, Brand, PaginatedResult } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export interface BrandsListParams {
  page?: number
  limit?: number
  search?: string
}

export interface BrandsResponseShape {
  items: Brand[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

function normalizeBrandsList(
  data: PaginatedResult<Brand> | BrandsResponseShape | Brand[]
): PaginatedResult<Brand> {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: 1,
        limit: data.length,
        total: data.length,
      },
    }
  }

  const meta = "meta" in data ? data.meta : { page: 1, limit: 10, total: 0 }
  const items = Array.isArray(data) ? data : data.items || []

  return {
    items,
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? (items?.length || 10),
      total: meta.total ?? items?.length ?? 0,
      totalPages: meta.totalPages ?? undefined,
    },
  }
}

export const brandsApi = {
  create: async (data: CreateBrandInput): Promise<Brand> => {
    const response = await apiClient.post<ApiResponse<Brand>>(endpoints.brands.create, data)
    return response.data.data
  },

  list: async (params?: BrandsListParams): Promise<PaginatedResult<Brand>> => {
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<ApiResponse<PaginatedResult<Brand> | BrandsResponseShape | Brand[]>>(
      endpoints.brands.list,
      { params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined }
    )
    return normalizeBrandsList(response.data.data)
  },

  getById: async (id: string): Promise<Brand> => {
    const response = await apiClient.get<ApiResponse<Brand>>(endpoints.brands.getById(id))
    return response.data.data
  },

  update: async (id: string, data: UpdateBrandInput): Promise<Brand> => {
    const response = await apiClient.patch<ApiResponse<Brand>>(endpoints.brands.update(id), data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.brands.delete(id))
  },
}
